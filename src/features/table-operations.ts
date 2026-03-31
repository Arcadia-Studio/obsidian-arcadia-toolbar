import { Editor, Notice, Modal, App } from 'obsidian';
import type { TableContext, ArcadiaPluginInterface } from '../types';

// ============================================================================
// TABLE CONTEXT
// ============================================================================

export function getTableContext(editor: Editor): TableContext | null {
	const cursor = editor.getCursor();
	const lineCount = editor.lastLine();
	let tableStart = -1;
	let tableEnd = -1;

	for (let i = cursor.line; i >= 0; i--) {
		const line = editor.getLine(i).trim();
		if (line.startsWith('|') && line.endsWith('|')) {
			tableStart = i;
		} else if (tableStart !== -1) {
			tableStart = i + 1;
			break;
		}
		if (i === 0 && tableStart !== -1) tableStart = 0;
	}
	if (tableStart === -1) return null;

	for (let i = cursor.line; i <= lineCount; i++) {
		const line = editor.getLine(i).trim();
		if (line.startsWith('|') && line.endsWith('|')) {
			tableEnd = i;
		} else {
			break;
		}
	}
	if (tableEnd === -1) return null;

	const rawLines: string[] = [];
	const rows: string[][] = [];
	let separatorRow = -1;

	for (let i = tableStart; i <= tableEnd; i++) {
		const line = editor.getLine(i);
		rawLines.push(line);
		const cells = line.split('|').slice(1, -1).map(c => c.trim());
		rows.push(cells);
		if (cells.every(c => /^:?-+:?$/.test(c))) {
			separatorRow = i - tableStart;
		}
	}

	const cursorLine = editor.getLine(cursor.line);
	let currentCol = 0;
	let pipeCount = 0;
	for (let i = 0; i < cursor.ch; i++) {
		if (cursorLine[i] === '|') pipeCount++;
	}
	currentCol = Math.max(0, pipeCount - 1);

	return {
		tableStart,
		tableEnd,
		rows,
		rawLines,
		headerRow: 0,
		separatorRow,
		currentRow: cursor.line - tableStart,
		currentCol,
	};
}

export function renderTable(rows: string[][]): string {
	if (rows.length === 0) return '';
	const colWidths = rows[0].map((_, ci) =>
		Math.max(...rows.map(r => (r[ci] || '').length), 3)
	);
	return rows.map(row =>
		'| ' + row.map((cell, ci) => (cell || '').padEnd(colWidths[ci])).join(' | ') + ' |'
	).join('\n');
}

// ============================================================================
// TABLE OPERATIONS
// ============================================================================

export function setColumnAlignment(editor: Editor, align: 'left' | 'center' | 'right'): void {
	const tc = getTableContext(editor);
	if (!tc || tc.separatorRow === -1) { new Notice('Place cursor inside a table with a separator row'); return; }
	const sepRow = tc.rows[tc.separatorRow];
	const col = tc.currentCol;
	if (col >= sepRow.length) return;
	const width = Math.max(sepRow[col].replace(/:/g, '').length, 3);
	const dashes = '-'.repeat(width);
	sepRow[col] = align === 'left' ? ':' + dashes : align === 'right' ? dashes + ':' : ':' + dashes + ':';
	const table = renderTable(tc.rows);
	editor.replaceRange(table, { line: tc.tableStart, ch: 0 }, { line: tc.tableEnd, ch: editor.getLine(tc.tableEnd).length });
	new Notice(`Column aligned ${align}`);
}

export function sortTableColumn(editor: Editor, direction: 'asc' | 'desc'): void {
	const tc = getTableContext(editor);
	if (!tc || tc.separatorRow === -1) { new Notice('Place cursor inside a table'); return; }
	const col = tc.currentCol;
	const header = tc.rows[0];
	const separator = tc.rows[tc.separatorRow];
	const dataRows = tc.rows.filter((_, i) => i !== 0 && i !== tc.separatorRow);
	dataRows.sort((a, b) => {
		const va = (a[col] || '').trim();
		const vb = (b[col] || '').trim();
		const na = parseFloat(va);
		const nb = parseFloat(vb);
		if (!isNaN(na) && !isNaN(nb)) {
			return direction === 'asc' ? na - nb : nb - na;
		}
		return direction === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
	});
	const newRows = [header, separator, ...dataRows];
	const table = renderTable(newRows);
	editor.replaceRange(table, { line: tc.tableStart, ch: 0 }, { line: tc.tableEnd, ch: editor.getLine(tc.tableEnd).length });
	new Notice(`Sorted ${direction === 'asc' ? 'A\u2192Z' : 'Z\u2192A'}`);
}

export function csvToTable(editor: Editor): void {
	const sel = editor.getSelection();
	if (!sel.trim()) {
		void navigator.clipboard.readText().then(text => {
			if (!text.trim()) { new Notice('No CSV data in clipboard or selection'); return; }
			parseCsvAndInsert(editor, text);
		}).catch(() => new Notice('Could not read clipboard'));
		return;
	}
	parseCsvAndInsert(editor, sel);
}

function parseCsvAndInsert(editor: Editor, csv: string): void {
	const lines = csv.trim().split('\n');
	const rows = lines.map(line => {
		const cells: string[] = [];
		let current = '';
		let inQuotes = false;
		for (let i = 0; i < line.length; i++) {
			const ch = line[i];
			if (ch === '"') {
				if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
				else inQuotes = !inQuotes;
			} else if (ch === ',' && !inQuotes) {
				cells.push(current.trim());
				current = '';
			} else {
				current += ch;
			}
		}
		cells.push(current.trim());
		return cells;
	});

	if (rows.length === 0) { new Notice('No valid CSV data'); return; }
	const colCount = Math.max(...rows.map(r => r.length));
	const normalized = rows.map(r => {
		while (r.length < colCount) r.push('');
		return r;
	});

	let table = renderTable([normalized[0]]) + '\n';
	table += '| ' + Array.from({ length: colCount }, () => '---').join(' | ') + ' |\n';
	if (normalized.length > 1) {
		table += normalized.slice(1).map(r =>
			'| ' + r.map(c => c.padEnd(3)).join(' | ') + ' |'
		).join('\n') + '\n';
	}
	editor.replaceSelection(table);
	new Notice(`Converted CSV to ${normalized.length}\u00d7${colCount} table`);
}

export function tableToCsv(editor: Editor): void {
	const tc = getTableContext(editor);
	if (!tc) { new Notice('Place cursor inside a table'); return; }
	const dataRows = tc.rows.filter((_, i) => i !== tc.separatorRow);
	const csv = dataRows.map(row => row.map(cell => {
		const c = cell.trim();
		return c.includes(',') || c.includes('"') || c.includes('\n')
			? '"' + c.replace(/"/g, '""') + '"' : c;
	}).join(',')).join('\n');
	navigator.clipboard.writeText(csv);
	new Notice('Table copied as CSV to clipboard');
}

export function transposeTable(editor: Editor): void {
	const tc = getTableContext(editor);
	if (!tc) { new Notice('Place cursor inside a table'); return; }
	const dataRows = tc.rows.filter((_, i) => i !== tc.separatorRow);
	const colCount = Math.max(...dataRows.map(r => r.length));
	const transposed: string[][] = [];
	for (let c = 0; c < colCount; c++) {
		transposed.push(dataRows.map(r => (r[c] || '').trim()));
	}
	const header = transposed[0];
	const separator = header.map(() => '---');
	const body = transposed.slice(1);
	const newRows = [header, separator, ...body];
	const table = renderTable(newRows);
	editor.replaceRange(table, { line: tc.tableStart, ch: 0 }, { line: tc.tableEnd, ch: editor.getLine(tc.tableEnd).length });
	new Notice('Table transposed');
}

export function numberTableRows(editor: Editor): void {
	const tc = getTableContext(editor);
	if (!tc || tc.separatorRow === -1) { new Notice('Place cursor inside a table'); return; }
	let num = 1;
	const newRows = tc.rows.map((row, i) => {
		if (i === 0) return ['#', ...row];
		if (i === tc.separatorRow) return ['---', ...row];
		return [String(num++), ...row];
	});
	const table = renderTable(newRows);
	editor.replaceRange(table, { line: tc.tableStart, ch: 0 }, { line: tc.tableEnd, ch: editor.getLine(tc.tableEnd).length });
	new Notice('Rows numbered');
}

// ============================================================================
// TABLE FILTER (uses Obsidian Modal instead of window.prompt)
// ============================================================================

class FilterTableModal extends Modal {
	private result: string = '';
	private onSubmit: (value: string) => void;

	constructor(app: App, onSubmit: (value: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl('h3', { text: 'Filter Table Rows' });

		const inputEl = contentEl.createEl('input', {
			type: 'text',
			placeholder: 'Enter filter keyword...',
		});
		inputEl.style.width = '100%';
		inputEl.style.marginBottom = '12px';
		inputEl.addEventListener('input', () => {
			this.result = inputEl.value;
		});
		inputEl.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				this.close();
				this.onSubmit(this.result);
			}
		});

		const btnContainer = contentEl.createEl('div', { cls: 'modal-button-container' });
		const submitBtn = btnContainer.createEl('button', { text: 'Filter', cls: 'mod-cta' });
		submitBtn.addEventListener('click', () => {
			this.close();
			this.onSubmit(this.result);
		});
		const cancelBtn = btnContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => this.close());

		setTimeout(() => inputEl.focus(), 10);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

export function filterTableRows(plugin: ArcadiaPluginInterface, editor: Editor): void {
	const tc = getTableContext(editor);
	if (!tc || tc.separatorRow === -1) { new Notice('Place cursor inside a table'); return; }

	new FilterTableModal(plugin.app, (keyword: string) => {
		if (!keyword) return;
		const lc = keyword.toLowerCase();
		const origText = tc.rawLines.join('\n');
		plugin._filteredTableBackup = { start: tc.tableStart, end: tc.tableEnd, original: origText };
		const kept: string[][] = [];
		for (let i = 0; i < tc.rows.length; i++) {
			if (i === 0 || i === tc.separatorRow) { kept.push(tc.rows[i]); continue; }
			const rowText = tc.rows[i].join(' ').toLowerCase();
			if (rowText.includes(lc)) kept.push(tc.rows[i]);
		}
		if (kept.length <= 2) { new Notice('No rows match that filter'); plugin._filteredTableBackup = null; return; }
		const table = renderTable(kept);
		editor.replaceRange(table, { line: tc.tableStart, ch: 0 }, { line: tc.tableEnd, ch: editor.getLine(tc.tableEnd).length });
		new Notice(`Filtered: ${kept.length - 2} row(s) shown. Use "Clear Filter" to restore.`);
	}).open();
}

export function clearTableFilter(plugin: ArcadiaPluginInterface, editor: Editor): void {
	if (!plugin._filteredTableBackup) { new Notice('No active filter to clear'); return; }
	const { start, original } = plugin._filteredTableBackup;
	const tc = getTableContext(editor);
	if (tc) {
		editor.replaceRange(original, { line: tc.tableStart, ch: 0 }, { line: tc.tableEnd, ch: editor.getLine(tc.tableEnd).length });
	} else {
		editor.setCursor({ line: start, ch: 0 });
		editor.replaceRange(original + '\n', { line: start, ch: 0 });
	}
	plugin._filteredTableBackup = null;
	new Notice('Filter cleared, original table restored');
}
