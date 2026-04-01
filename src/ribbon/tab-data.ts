import type { ArcadiaPluginInterface, EditorContext } from '../types';
import { TABLE_TEMPLATES } from '../types';
import { createButton } from '../components/button';
import { addGroup } from '../components/group';
import { createDropdownTrigger, positionDropdown, closeDropdowns } from '../components/dropdown';
import {
	setColumnAlignment,
	sortTableColumn,
	csvToTable,
	tableToCsv,
	transposeTable,
	numberTableRows,
	filterTableRows,
	clearTableFilter,
} from '../features/table-operations';
import {
	aiGenerateTable,
	aiFillTableData,
	aiAddCalculatedColumn,
} from '../features/ai-integration';
import { setIcon } from 'obsidian';

export function buildDataTab(plugin: ArcadiaPluginInterface, container: HTMLElement, ctx: EditorContext | null): void {
	// ---- Tables group (size picker + templates dropdown) ----
	const sizePickerTrigger = createDropdownTrigger({
		icon: 'table',
		tooltip: 'Insert table (Size picker)',
		label: 'New table',
		openFn: (wrapper) => openTableSizeDropdown(plugin, wrapper, ctx),
	});

	const templateTrigger = createDropdownTrigger({
		icon: 'layout-template',
		tooltip: 'Table templates',
		label: 'Templates',
		openFn: (wrapper) => openTableTemplatesDropdown(plugin, wrapper, ctx),
	});

	addGroup(container, 'Tables', [sizePickerTrigger, templateTrigger]);

	// ---- Rows & Cols group ----
	const rowColBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'plus-square',
			tooltip: 'Add row above',
			action: () => plugin.executeCommand('editor:insert-newline-above'),
		}),
		createButton(plugin, {
			icon: 'minus-square',
			tooltip: 'Delete current row',
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (!activeCtx) return;
				const cursor = activeCtx.editor.getCursor();
				activeCtx.editor.replaceRange(
					'',
					{ line: cursor.line, ch: 0 },
					{ line: cursor.line + 1, ch: 0 }
				);
			},
		}),
		createButton(plugin, {
			icon: 'list-ordered',
			tooltip: 'Number rows',
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) numberTableRows(activeCtx.editor);
			},
		}),
	];
	addGroup(container, 'Rows & cols', rowColBtns);

	// ---- Format group ----
	const formatBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'align-left',
			tooltip: 'Align column left',
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) setColumnAlignment(activeCtx.editor, 'left');
			},
		}),
		createButton(plugin, {
			icon: 'align-center',
			tooltip: 'Align column center',
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) setColumnAlignment(activeCtx.editor, 'center');
			},
		}),
		createButton(plugin, {
			icon: 'align-right',
			tooltip: 'Align column right',
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) setColumnAlignment(activeCtx.editor, 'right');
			},
		}),
	];
	addGroup(container, 'Format', formatBtns);

	// ---- Data group ----
	const dataBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'download',
			tooltip: 'Import CSV to table',
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) csvToTable(activeCtx.editor);
			},
		}),
		createButton(plugin, {
			icon: 'upload',
			tooltip: 'Export table as CSV',
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) tableToCsv(activeCtx.editor);
			},
		}),
		createButton(plugin, {
			icon: 'rotate-ccw',
			tooltip: 'Transpose table',
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) transposeTable(activeCtx.editor);
			},
		}),
	];
	addGroup(container, 'Data', dataBtns);

	// ---- Formulas group ----
	const formulaBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'filter',
			tooltip: 'Filter table rows',
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) filterTableRows(plugin, activeCtx.editor);
			},
		}),
		createButton(plugin, {
			icon: 'x-circle',
			tooltip: 'Clear filter',
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) clearTableFilter(plugin, activeCtx.editor);
			},
		}),
		createButton(plugin, {
			icon: 'arrow-up-az',
			tooltip: 'Sort column ascending',
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) sortTableColumn(activeCtx.editor, 'asc');
			},
		}),
		createButton(plugin, {
			icon: 'arrow-down-az',
			tooltip: 'Sort column descending',
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) sortTableColumn(activeCtx.editor, 'desc');
			},
		}),
	];
	addGroup(container, 'Formulas', formulaBtns);

	// ---- Charts group ----
	const chartBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'bar-chart-2',
			tooltip: 'Insert chart (Dataview)',
			pluginId: 'dataview',
			action: () => plugin.executeCommand('dataview:new-query'),
		}),
	];
	addGroup(container, 'Charts', chartBtns);

	// ---- AI Tools group ----
	const aiBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'sparkles',
			tooltip: 'Generate table with AI',
			requiresAI: true,
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) void aiGenerateTable(plugin, activeCtx.editor);
			},
		}),
		createButton(plugin, {
			icon: 'wand',
			tooltip: 'Fill table data with AI',
			requiresAI: true,
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) void aiFillTableData(plugin, activeCtx.editor);
			},
		}),
		createButton(plugin, {
			icon: 'calculator',
			tooltip: 'Add calculated column with AI',
			requiresAI: true,
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) void aiAddCalculatedColumn(plugin, activeCtx.editor);
			},
		}),
	];
	addGroup(container, 'AI tools', aiBtns);
}

function openTableSizeDropdown(plugin: ArcadiaPluginInterface, anchor: HTMLElement, ctx: EditorContext | null): void {
	closeDropdowns(plugin);

	const dropdown = document.createElement('div');
	dropdown.className = 'arcadia-dropdown-menu arcadia-table-picker';

	const title = document.createElement('div');
	title.className = 'arcadia-dropdown-title';
	title.textContent = 'Table size';
	dropdown.appendChild(title);

	const grid = document.createElement('div');
	grid.className = 'arcadia-table-size-grid';

	const MAX_COLS = 8;
	const MAX_ROWS = 8;
	let hoveredRow = 0;
	let hoveredCol = 0;

	const cells: HTMLElement[][] = [];

	for (let r = 0; r < MAX_ROWS; r++) {
		cells[r] = [];
		for (let c = 0; c < MAX_COLS; c++) {
			const cell = document.createElement('div');
			cell.className = 'arcadia-table-size-cell';
			cell.dataset.row = String(r + 1);
			cell.dataset.col = String(c + 1);

			cell.addEventListener('mouseover', () => {
				hoveredRow = r + 1;
				hoveredCol = c + 1;
				updateHighlight();
				sizeLabel.textContent = `${hoveredRow} x ${hoveredCol}`;
			});

			cell.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				insertSizedTable(plugin, ctx, hoveredRow, hoveredCol);
				closeDropdowns(plugin);
			});

			cells[r][c] = cell;
			grid.appendChild(cell);
		}
	}

	function updateHighlight(): void {
		for (let r = 0; r < MAX_ROWS; r++) {
			for (let c = 0; c < MAX_COLS; c++) {
				if (r < hoveredRow && c < hoveredCol) {
					cells[r][c].classList.add('arcadia-table-size-cell-hover');
				} else {
					cells[r][c].classList.remove('arcadia-table-size-cell-hover');
				}
			}
		}
	}

	dropdown.appendChild(grid);

	const sizeLabel = document.createElement('div');
	sizeLabel.className = 'arcadia-table-size-label';
	sizeLabel.textContent = 'Hover to select size';
	dropdown.appendChild(sizeLabel);

	positionDropdown(plugin, dropdown, anchor);
}

function insertSizedTable(plugin: ArcadiaPluginInterface, ctx: EditorContext | null, rows: number, cols: number): void {
	const activeCtx = ctx || plugin.getActiveEditor();
	if (!activeCtx) return;

	const header = '| ' + Array.from({ length: cols }, (_, i) => `Header ${i + 1}`).join(' | ') + ' |';
	const separator = '| ' + Array.from({ length: cols }, () => '--------').join(' | ') + ' |';
	const dataRow = '| ' + Array.from({ length: cols }, () => '        ').join(' | ') + ' |';
	const dataRows = Array.from({ length: rows - 1 }, () => dataRow).join('\n');

	const table = `\n${header}\n${separator}\n${dataRows}\n`;
	const cursor = activeCtx.editor.getCursor();
	activeCtx.editor.replaceRange(table, cursor);
	activeCtx.editor.setCursor({ line: cursor.line + 1, ch: 2 });
}

function openTableTemplatesDropdown(plugin: ArcadiaPluginInterface, anchor: HTMLElement, ctx: EditorContext | null): void {
	closeDropdowns(plugin);

	const dropdown = document.createElement('div');
	dropdown.className = 'arcadia-dropdown-menu';

	const title = document.createElement('div');
	title.className = 'arcadia-dropdown-title';
	title.textContent = 'Table templates';
	dropdown.appendChild(title);

	for (const tmpl of TABLE_TEMPLATES) {
		const item = document.createElement('button');
		item.className = 'arcadia-dropdown-item';

		const iconSpan = document.createElement('span');
		setIcon(iconSpan, tmpl.icon);
		item.appendChild(iconSpan);

		const nameSpan = document.createElement('span');
		nameSpan.textContent = tmpl.name;
		item.appendChild(nameSpan);

		const descSpan = document.createElement('span');
		descSpan.className = 'arcadia-dropdown-item-hint';
		descSpan.textContent = tmpl.desc;
		item.appendChild(descSpan);

		item.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			const activeCtx = ctx || plugin.getActiveEditor();
			if (activeCtx) {
				activeCtx.editor.replaceRange(tmpl.template, activeCtx.editor.getCursor());
			}
			closeDropdowns(plugin);
		});

		dropdown.appendChild(item);
	}

	positionDropdown(plugin, dropdown, anchor);
}
