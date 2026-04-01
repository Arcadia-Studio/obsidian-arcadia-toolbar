import { Command, Editor, Notice } from 'obsidian';
import type { ArcadiaPluginInterface } from '../types';
import * as ec from '../features/editor-commands';
import * as so from '../features/slide-operations';
import * as ai from '../features/ai-integration';
import { getTableContext, renderTable, setColumnAlignment, sortTableColumn, csvToTable, tableToCsv, transposeTable, numberTableRows, filterTableRows, clearTableFilter } from '../features/table-operations';
import { readAloud, stopSpeaking, showDocStats, createUnresolvedPages } from './dom';

export function registerCommands(plugin: ArcadiaPluginInterface & { addCommand: (cmd: Command) => Command }): void {
	const p = plugin;

	// Undo/Redo
	p.addCommand({ id: 'undo', name: 'Undo', editorCallback: (e: Editor) => (e as unknown as { undo(): void }).undo() });
	p.addCommand({ id: 'redo', name: 'Redo', editorCallback: (e: Editor) => (e as unknown as { redo(): void }).redo() });

	// Text formatting
	p.addCommand({ id: 'toggle-bold', name: 'Toggle bold', editorCallback: (e: Editor) => ec.toggleWrap(e, '**') });
	p.addCommand({ id: 'toggle-italic', name: 'Toggle italic', editorCallback: (e: Editor) => ec.toggleWrap(e, '*') });
	p.addCommand({ id: 'toggle-underline', name: 'Toggle underline', editorCallback: (e: Editor) => ec.toggleHtmlWrap(e, 'u') });
	p.addCommand({ id: 'toggle-strikethrough', name: 'Toggle strikethrough', editorCallback: (e: Editor) => ec.toggleWrap(e, '~~') });
	p.addCommand({ id: 'toggle-highlight', name: 'Toggle highlight', editorCallback: (e: Editor) => ec.toggleWrap(e, '==') });
	p.addCommand({ id: 'toggle-subscript', name: 'Toggle subscript', editorCallback: (e: Editor) => ec.toggleHtmlWrap(e, 'sub') });
	p.addCommand({ id: 'toggle-superscript', name: 'Toggle superscript', editorCallback: (e: Editor) => ec.toggleHtmlWrap(e, 'sup') });
	p.addCommand({ id: 'clear-formatting', name: 'Clear formatting', editorCallback: (e: Editor) => ec.clearFormatting(e) });

	// Headings
	for (let i = 1; i <= 6; i++) {
		p.addCommand({ id: `heading-${i}`, name: `Heading ${i}`, editorCallback: (e: Editor) => ec.insertHeading(e, i) });
	}

	// Lists
	p.addCommand({ id: 'bullet-list', name: 'Toggle bullet list', editorCallback: (e: Editor) => ec.toggleBulletList(e) });
	p.addCommand({ id: 'numbered-list', name: 'Toggle numbered list', editorCallback: (e: Editor) => ec.toggleNumberedList(e) });
	p.addCommand({ id: 'checklist', name: 'Toggle checklist', editorCallback: (e: Editor) => ec.toggleChecklist(e) });
	p.addCommand({ id: 'blockquote', name: 'Toggle blockquote', editorCallback: (e: Editor) => ec.toggleBlockquote(e) });

	// Alignment
	p.addCommand({ id: 'align-left', name: 'Align left', editorCallback: (e: Editor) => ec.setAlignment(e, 'left') });
	p.addCommand({ id: 'align-center', name: 'Align center', editorCallback: (e: Editor) => ec.setAlignment(e, 'center') });
	p.addCommand({ id: 'align-right', name: 'Align right', editorCallback: (e: Editor) => ec.setAlignment(e, 'right') });
	p.addCommand({ id: 'align-justify', name: 'Align justify', editorCallback: (e: Editor) => ec.setAlignment(e, 'justify') });

	// Insert
	p.addCommand({ id: 'insert-link', name: 'Insert link', editorCallback: (e: Editor) => ec.insertLink(e) });
	p.addCommand({ id: 'insert-image', name: 'Insert image', editorCallback: (e: Editor) => ec.insertImage(e) });
	p.addCommand({ id: 'insert-table', name: 'Insert table', editorCallback: (e: Editor) => ec.insertTable(e) });
	p.addCommand({ id: 'insert-code-block', name: 'Insert code block', editorCallback: (e: Editor) => ec.insertCodeBlock(e) });
	p.addCommand({ id: 'insert-horizontal-rule', name: 'Insert horizontal rule', editorCallback: (e: Editor) => ec.insertHorizontalRule(e) });
	p.addCommand({ id: 'insert-callout', name: 'Insert callout', editorCallback: (e: Editor) => ec.insertCallout(e) });
	p.addCommand({ id: 'insert-footnote', name: 'Insert footnote', editorCallback: (e: Editor) => ec.insertFootnote(e) });
	p.addCommand({ id: 'insert-scripture', name: 'Insert scripture block', editorCallback: (e: Editor) => ec.insertScriptureBlock(p, e) });

	// Math & Embeds
	p.addCommand({ id: 'insert-latex-block', name: 'Insert LaTeX block', editorCallback: (e: Editor) => ec.insertLatexBlock(e) });
	p.addCommand({ id: 'insert-inline-math', name: 'Insert inline math', editorCallback: (e: Editor) => ec.insertInlineMath(e) });
	p.addCommand({ id: 'insert-file-embed', name: 'Insert file embed', editorCallback: (e: Editor) => ec.insertFileEmbed(e) });
	p.addCommand({ id: 'insert-mermaid', name: 'Insert Mermaid diagram', editorCallback: (e: Editor) => ec.insertMermaidBlock(e) });
	p.addCommand({ id: 'insert-plantuml', name: 'Insert PlantUML block', editorCallback: (e: Editor) => ec.insertPlantUMLBlock(e) });
	p.addCommand({ id: 'insert-template', name: 'Insert template', callback: () => plugin.executeCommand('templates:insert-template') });

	// Slides
	p.addCommand({ id: 'insert-slide-separator', name: 'Insert slide separator', editorCallback: (e: Editor) => so.insertSlideSeparator(e) });
	p.addCommand({ id: 'insert-speaker-notes', name: 'Insert speaker notes', editorCallback: (e: Editor) => so.insertSpeakerNotes(e) });
	p.addCommand({ id: 'insert-slide-columns', name: 'Insert slide columns', editorCallback: (e: Editor) => so.insertSlideColumns(e) });
	p.addCommand({ id: 'insert-slide-grid', name: 'Insert slide grid', editorCallback: (e: Editor) => so.insertSlideGrid(e) });
	p.addCommand({ id: 'insert-slide-background', name: 'Insert slide background', editorCallback: (e: Editor) => so.insertSlideBackground(e) });

	// References
	p.addCommand({ id: 'cite-turabian', name: 'Insert turabian citation', editorCallback: (e: Editor) => ec.insertCitationFootnote(e, 'turabian') });
	p.addCommand({ id: 'cite-chicago', name: 'Insert chicago citation', editorCallback: (e: Editor) => ec.insertCitationFootnote(e, 'chicago') });
	p.addCommand({ id: 'cite-apa-inline', name: 'Insert apa inline citation', editorCallback: (e: Editor) => ec.insertInlineCitation(e, 'apa') });
	p.addCommand({ id: 'cite-mla-inline', name: 'Insert mla inline citation', editorCallback: (e: Editor) => ec.insertInlineCitation(e, 'mla') });
	p.addCommand({ id: 'generate-bibliography', name: 'Generate bibliography', editorCallback: (e: Editor) => ec.generateBibliography(e) });
	p.addCommand({ id: 'create-missing-pages', name: 'Create missing pages', callback: () => { void createUnresolvedPages(p); } });

	// AI-powered
	p.addCommand({ id: 'ai-convert-citations-turabian', name: 'AI: convert citations to turabian', editorCallback: (e: Editor) => { void ai.aiConvertCitationsInDocument(p, e, 'turabian'); } });
	p.addCommand({ id: 'ai-convert-citations-chicago', name: 'AI: convert citations to chicago', editorCallback: (e: Editor) => { void ai.aiConvertCitationsInDocument(p, e, 'chicago'); } });
	p.addCommand({ id: 'ai-convert-citations-apa', name: 'AI: convert citations to apa', editorCallback: (e: Editor) => { void ai.aiConvertCitationsInDocument(p, e, 'apa'); } });
	p.addCommand({ id: 'ai-convert-citations-mla', name: 'AI: convert citations to mla', editorCallback: (e: Editor) => { void ai.aiConvertCitationsInDocument(p, e, 'mla'); } });
	p.addCommand({ id: 'ai-link-citations', name: 'AI: link citations to google books', editorCallback: (e: Editor) => { void ai.aiLinkCitations(p, e); } });
	p.addCommand({ id: 'ai-notes-to-slides', name: 'AI: convert notes to slides', editorCallback: (e: Editor) => { void ai.aiNotesToSlides(p, e); } });

	// View
	p.addCommand({ id: 'zoom-in', name: 'Zoom in', callback: () => p.executeCommand('window:zoom-in') });
	p.addCommand({ id: 'zoom-out', name: 'Zoom out', callback: () => p.executeCommand('window:zoom-out') });
	p.addCommand({ id: 'reset-zoom', name: 'Reset zoom', callback: () => p.executeCommand('window:reset-zoom') });
	p.addCommand({ id: 'split-right', name: 'Split right', callback: () => p.executeCommand('workspace:split-vertical') });
	p.addCommand({ id: 'split-down', name: 'Split down', callback: () => p.executeCommand('workspace:split-horizontal') });

	// TOC
	p.addCommand({ id: 'toggle-toc', name: 'Toggle table of contents', callback: () => { void p.toggleTOC(); } });

	// Navigate
	p.addCommand({ id: 'nav-back', name: 'Navigate back', callback: () => p.executeCommand('app:go-back') });
	p.addCommand({ id: 'nav-forward', name: 'Navigate forward', callback: () => p.executeCommand('app:go-forward') });
	p.addCommand({ id: 'new-tab', name: 'New tab', callback: () => p.executeCommand('workspace:new-tab') });
	p.addCommand({ id: 'close-tab', name: 'Close tab', callback: () => p.executeCommand('workspace:close') });

	// Review extras
	p.addCommand({ id: 'read-aloud', name: 'Read aloud', callback: () => readAloud(p) });
	p.addCommand({ id: 'stop-speaking', name: 'Stop speaking', callback: () => stopSpeaking() });
	p.addCommand({ id: 'insert-comment', name: 'Insert comment', editorCallback: (e: Editor) => ec.insertComment(e) });
	p.addCommand({ id: 'doc-stats', name: 'Document statistics', callback: () => showDocStats(p) });

	// Data tab
	p.addCommand({ id: 'table-add-row', name: 'Table: add row below', editorCallback: (e: Editor) => {
		const tc = getTableContext(e);
		if (!tc) { new Notice('Place cursor inside a table'); return; }
		const colCount = tc.rows[0].length;
		const newRow = '| ' + new Array(colCount).fill('   ').join(' | ') + ' |';
		const insertLine = tc.tableStart + tc.currentRow;
		e.replaceRange('\n' + newRow, { line: insertLine, ch: e.getLine(insertLine).length });
	}});
	p.addCommand({ id: 'table-delete-row', name: 'Table: delete current row', editorCallback: (e: Editor) => {
		const tc = getTableContext(e);
		if (!tc) return;
		if (tc.currentRow === 0 || tc.currentRow === tc.separatorRow) return;
		const newRows = tc.rows.filter((_, i) => i !== tc.currentRow);
		e.replaceRange(renderTable(newRows), { line: tc.tableStart, ch: 0 }, { line: tc.tableEnd, ch: e.getLine(tc.tableEnd).length });
	}});
	p.addCommand({ id: 'table-align-left', name: 'Table: align column left', editorCallback: (e: Editor) => setColumnAlignment(e, 'left') });
	p.addCommand({ id: 'table-align-center', name: 'Table: align column center', editorCallback: (e: Editor) => setColumnAlignment(e, 'center') });
	p.addCommand({ id: 'table-align-right', name: 'Table: align column right', editorCallback: (e: Editor) => setColumnAlignment(e, 'right') });
	p.addCommand({ id: 'table-sort-asc', name: 'Table: sort column ascending', editorCallback: (e: Editor) => sortTableColumn(e, 'asc') });
	p.addCommand({ id: 'table-sort-desc', name: 'Table: sort column descending', editorCallback: (e: Editor) => sortTableColumn(e, 'desc') });
	p.addCommand({ id: 'csv-to-table', name: 'CSV to table', editorCallback: (e: Editor) => csvToTable(e) });
	p.addCommand({ id: 'table-to-csv', name: 'Table to CSV', editorCallback: (e: Editor) => tableToCsv(e) });
	p.addCommand({ id: 'transpose-table', name: 'Transpose table', editorCallback: (e: Editor) => transposeTable(e) });
	p.addCommand({ id: 'number-rows', name: 'Number table rows', editorCallback: (e: Editor) => numberTableRows(e) });
	p.addCommand({ id: 'filter-table', name: 'Table: filter rows', editorCallback: (e: Editor) => filterTableRows(p, e) });
	p.addCommand({ id: 'clear-table-filter', name: 'Table: clear filter', editorCallback: (e: Editor) => clearTableFilter(p, e) });
	p.addCommand({ id: 'ai-generate-table', name: 'AI: generate table', editorCallback: (e: Editor) => { void ai.aiGenerateTable(p, e); } });
	p.addCommand({ id: 'ai-fill-table', name: 'AI: fill table data', editorCallback: (e: Editor) => { void ai.aiFillTableData(p, e); } });
	p.addCommand({ id: 'ai-calc-column', name: 'AI: add calculated column', editorCallback: (e: Editor) => { void ai.aiAddCalculatedColumn(p, e); } });
}
