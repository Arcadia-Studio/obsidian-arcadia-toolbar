import { Command, Editor, Notice } from 'obsidian';
import type { ArcadiaPluginInterface } from '../types';
import * as ec from '../features/editor-commands';
import * as so from '../features/slide-operations';
import * as ai from '../features/ai-integration';
import { getTableContext, renderTable, setColumnAlignment, sortTableColumn, csvToTable, tableToCsv, transposeTable, numberTableRows, filterTableRows, clearTableFilter } from '../features/table-operations';
import { showWordCountGoal, readAloud, stopSpeaking, showDocStats, createUnresolvedPages } from './dom';

export function registerCommands(plugin: ArcadiaPluginInterface & { addCommand: (cmd: Command) => Command }): void {
	const p = plugin;

	// Undo/Redo
	p.addCommand({ id: 'undo', name: 'Undo', editorCallback: (e: Editor) => (e as unknown as { undo(): void }).undo() });
	p.addCommand({ id: 'redo', name: 'Redo', editorCallback: (e: Editor) => (e as unknown as { redo(): void }).redo() });

	// Text formatting
	p.addCommand({ id: 'toggle-bold', name: 'Toggle Bold', editorCallback: (e: Editor) => ec.toggleWrap(e, '**') });
	p.addCommand({ id: 'toggle-italic', name: 'Toggle Italic', editorCallback: (e: Editor) => ec.toggleWrap(e, '*') });
	p.addCommand({ id: 'toggle-underline', name: 'Toggle Underline', editorCallback: (e: Editor) => ec.toggleHtmlWrap(e, 'u') });
	p.addCommand({ id: 'toggle-strikethrough', name: 'Toggle Strikethrough', editorCallback: (e: Editor) => ec.toggleWrap(e, '~~') });
	p.addCommand({ id: 'toggle-highlight', name: 'Toggle Highlight', editorCallback: (e: Editor) => ec.toggleWrap(e, '==') });
	p.addCommand({ id: 'toggle-subscript', name: 'Toggle Subscript', editorCallback: (e: Editor) => ec.toggleHtmlWrap(e, 'sub') });
	p.addCommand({ id: 'toggle-superscript', name: 'Toggle Superscript', editorCallback: (e: Editor) => ec.toggleHtmlWrap(e, 'sup') });
	p.addCommand({ id: 'clear-formatting', name: 'Clear Formatting', editorCallback: (e: Editor) => ec.clearFormatting(e) });

	// Headings
	for (let i = 1; i <= 6; i++) {
		p.addCommand({ id: `heading-${i}`, name: `Heading ${i}`, editorCallback: (e: Editor) => ec.insertHeading(e, i) });
	}

	// Lists
	p.addCommand({ id: 'bullet-list', name: 'Toggle Bullet List', editorCallback: (e: Editor) => ec.toggleBulletList(e) });
	p.addCommand({ id: 'numbered-list', name: 'Toggle Numbered List', editorCallback: (e: Editor) => ec.toggleNumberedList(e) });
	p.addCommand({ id: 'checklist', name: 'Toggle Checklist', editorCallback: (e: Editor) => ec.toggleChecklist(e) });
	p.addCommand({ id: 'blockquote', name: 'Toggle Blockquote', editorCallback: (e: Editor) => ec.toggleBlockquote(e) });

	// Alignment
	p.addCommand({ id: 'align-left', name: 'Align Left', editorCallback: (e: Editor) => ec.setAlignment(e, 'left') });
	p.addCommand({ id: 'align-center', name: 'Align Center', editorCallback: (e: Editor) => ec.setAlignment(e, 'center') });
	p.addCommand({ id: 'align-right', name: 'Align Right', editorCallback: (e: Editor) => ec.setAlignment(e, 'right') });
	p.addCommand({ id: 'align-justify', name: 'Align Justify', editorCallback: (e: Editor) => ec.setAlignment(e, 'justify') });

	// Insert
	p.addCommand({ id: 'insert-link', name: 'Insert Link', editorCallback: (e: Editor) => ec.insertLink(e) });
	p.addCommand({ id: 'insert-image', name: 'Insert Image', editorCallback: (e: Editor) => ec.insertImage(e) });
	p.addCommand({ id: 'insert-table', name: 'Insert Table', editorCallback: (e: Editor) => ec.insertTable(e) });
	p.addCommand({ id: 'insert-code-block', name: 'Insert Code Block', editorCallback: (e: Editor) => ec.insertCodeBlock(e) });
	p.addCommand({ id: 'insert-horizontal-rule', name: 'Insert Horizontal Rule', editorCallback: (e: Editor) => ec.insertHorizontalRule(e) });
	p.addCommand({ id: 'insert-callout', name: 'Insert Callout', editorCallback: (e: Editor) => ec.insertCallout(e) });
	p.addCommand({ id: 'insert-footnote', name: 'Insert Footnote', editorCallback: (e: Editor) => ec.insertFootnote(e) });
	p.addCommand({ id: 'insert-scripture', name: 'Insert Scripture Block', editorCallback: (e: Editor) => ec.insertScriptureBlock(p, e) });

	// Math & Embeds
	p.addCommand({ id: 'insert-latex-block', name: 'Insert LaTeX Block', editorCallback: (e: Editor) => ec.insertLatexBlock(e) });
	p.addCommand({ id: 'insert-inline-math', name: 'Insert Inline Math', editorCallback: (e: Editor) => ec.insertInlineMath(e) });
	p.addCommand({ id: 'insert-file-embed', name: 'Insert File Embed', editorCallback: (e: Editor) => ec.insertFileEmbed(e) });
	p.addCommand({ id: 'insert-mermaid', name: 'Insert Mermaid Diagram', editorCallback: (e: Editor) => ec.insertMermaidBlock(e) });
	p.addCommand({ id: 'insert-plantuml', name: 'Insert PlantUML Block', editorCallback: (e: Editor) => ec.insertPlantUMLBlock(e) });
	p.addCommand({ id: 'insert-template', name: 'Insert Template', callback: () => plugin.executeCommand('templates:insert-template') });

	// Slides
	p.addCommand({ id: 'insert-slide-separator', name: 'Insert Slide Separator', editorCallback: (e: Editor) => so.insertSlideSeparator(e) });
	p.addCommand({ id: 'insert-speaker-notes', name: 'Insert Speaker Notes', editorCallback: (e: Editor) => so.insertSpeakerNotes(e) });
	p.addCommand({ id: 'insert-slide-columns', name: 'Insert Slide Columns', editorCallback: (e: Editor) => so.insertSlideColumns(e) });
	p.addCommand({ id: 'insert-slide-grid', name: 'Insert Slide Grid', editorCallback: (e: Editor) => so.insertSlideGrid(e) });
	p.addCommand({ id: 'insert-slide-background', name: 'Insert Slide Background', editorCallback: (e: Editor) => so.insertSlideBackground(e) });

	// References
	p.addCommand({ id: 'cite-turabian', name: 'Insert Turabian Citation', editorCallback: (e: Editor) => ec.insertCitationFootnote(e, 'turabian') });
	p.addCommand({ id: 'cite-chicago', name: 'Insert Chicago Citation', editorCallback: (e: Editor) => ec.insertCitationFootnote(e, 'chicago') });
	p.addCommand({ id: 'cite-apa-inline', name: 'Insert APA Inline Citation', editorCallback: (e: Editor) => ec.insertInlineCitation(e, 'apa') });
	p.addCommand({ id: 'cite-mla-inline', name: 'Insert MLA Inline Citation', editorCallback: (e: Editor) => ec.insertInlineCitation(e, 'mla') });
	p.addCommand({ id: 'generate-bibliography', name: 'Generate Bibliography', editorCallback: (e: Editor) => ec.generateBibliography(e) });
	p.addCommand({ id: 'create-missing-pages', name: 'Create Missing Pages', callback: () => createUnresolvedPages(p) });

	// AI-powered
	p.addCommand({ id: 'ai-convert-citations-turabian', name: 'AI: Convert Citations to Turabian', editorCallback: (e: Editor) => ai.aiConvertCitationsInDocument(p, e, 'turabian') });
	p.addCommand({ id: 'ai-convert-citations-chicago', name: 'AI: Convert Citations to Chicago', editorCallback: (e: Editor) => ai.aiConvertCitationsInDocument(p, e, 'chicago') });
	p.addCommand({ id: 'ai-convert-citations-apa', name: 'AI: Convert Citations to APA', editorCallback: (e: Editor) => ai.aiConvertCitationsInDocument(p, e, 'apa') });
	p.addCommand({ id: 'ai-convert-citations-mla', name: 'AI: Convert Citations to MLA', editorCallback: (e: Editor) => ai.aiConvertCitationsInDocument(p, e, 'mla') });
	p.addCommand({ id: 'ai-link-citations', name: 'AI: Link Citations to Google Books', editorCallback: (e: Editor) => ai.aiLinkCitations(p, e) });
	p.addCommand({ id: 'ai-notes-to-slides', name: 'AI: Convert Notes to Slides', editorCallback: (e: Editor) => ai.aiNotesToSlides(p, e) });

	// View
	p.addCommand({ id: 'zoom-in', name: 'Zoom In', callback: () => p.executeCommand('window:zoom-in') });
	p.addCommand({ id: 'zoom-out', name: 'Zoom Out', callback: () => p.executeCommand('window:zoom-out') });
	p.addCommand({ id: 'reset-zoom', name: 'Reset Zoom', callback: () => p.executeCommand('window:reset-zoom') });
	p.addCommand({ id: 'split-right', name: 'Split Right', callback: () => p.executeCommand('workspace:split-vertical') });
	p.addCommand({ id: 'split-down', name: 'Split Down', callback: () => p.executeCommand('workspace:split-horizontal') });

	// TOC
	p.addCommand({ id: 'toggle-toc', name: 'Toggle Table of Contents', callback: () => p.toggleTOC() });

	// Navigate
	p.addCommand({ id: 'nav-back', name: 'Navigate Back', callback: () => p.executeCommand('app:go-back') });
	p.addCommand({ id: 'nav-forward', name: 'Navigate Forward', callback: () => p.executeCommand('app:go-forward') });
	p.addCommand({ id: 'new-tab', name: 'New Tab', callback: () => p.executeCommand('workspace:new-tab') });
	p.addCommand({ id: 'close-tab', name: 'Close Tab', callback: () => p.executeCommand('workspace:close') });

	// Review extras
	p.addCommand({ id: 'read-aloud', name: 'Read Aloud', callback: () => readAloud(p) });
	p.addCommand({ id: 'stop-speaking', name: 'Stop Speaking', callback: () => stopSpeaking() });
	p.addCommand({ id: 'insert-comment', name: 'Insert Comment', editorCallback: (e: Editor) => ec.insertComment(e) });
	p.addCommand({ id: 'doc-stats', name: 'Document Statistics', callback: () => showDocStats(p) });

	// Data tab
	p.addCommand({ id: 'table-add-row', name: 'Table: Add Row Below', editorCallback: (e: Editor) => {
		const tc = getTableContext(e);
		if (!tc) { new Notice('Place cursor inside a table'); return; }
		const colCount = tc.rows[0].length;
		const newRow = '| ' + new Array(colCount).fill('   ').join(' | ') + ' |';
		const insertLine = tc.tableStart + tc.currentRow;
		e.replaceRange('\n' + newRow, { line: insertLine, ch: e.getLine(insertLine).length });
	}});
	p.addCommand({ id: 'table-delete-row', name: 'Table: Delete Current Row', editorCallback: (e: Editor) => {
		const tc = getTableContext(e);
		if (!tc) return;
		if (tc.currentRow === 0 || tc.currentRow === tc.separatorRow) return;
		const newRows = tc.rows.filter((_, i) => i !== tc.currentRow);
		e.replaceRange(renderTable(newRows), { line: tc.tableStart, ch: 0 }, { line: tc.tableEnd, ch: e.getLine(tc.tableEnd).length });
	}});
	p.addCommand({ id: 'table-align-left', name: 'Table: Align Column Left', editorCallback: (e: Editor) => setColumnAlignment(e, 'left') });
	p.addCommand({ id: 'table-align-center', name: 'Table: Align Column Center', editorCallback: (e: Editor) => setColumnAlignment(e, 'center') });
	p.addCommand({ id: 'table-align-right', name: 'Table: Align Column Right', editorCallback: (e: Editor) => setColumnAlignment(e, 'right') });
	p.addCommand({ id: 'table-sort-asc', name: 'Table: Sort Column A\u2192Z', editorCallback: (e: Editor) => sortTableColumn(e, 'asc') });
	p.addCommand({ id: 'table-sort-desc', name: 'Table: Sort Column Z\u2192A', editorCallback: (e: Editor) => sortTableColumn(e, 'desc') });
	p.addCommand({ id: 'csv-to-table', name: 'CSV to Table', editorCallback: (e: Editor) => csvToTable(e) });
	p.addCommand({ id: 'table-to-csv', name: 'Table to CSV', editorCallback: (e: Editor) => tableToCsv(e) });
	p.addCommand({ id: 'transpose-table', name: 'Transpose Table', editorCallback: (e: Editor) => transposeTable(e) });
	p.addCommand({ id: 'number-rows', name: 'Number Table Rows', editorCallback: (e: Editor) => numberTableRows(e) });
	p.addCommand({ id: 'filter-table', name: 'Table: Filter Rows', editorCallback: (e: Editor) => filterTableRows(p, e) });
	p.addCommand({ id: 'clear-table-filter', name: 'Table: Clear Filter', editorCallback: (e: Editor) => clearTableFilter(p, e) });
	p.addCommand({ id: 'ai-generate-table', name: 'AI: Generate Table', editorCallback: (e: Editor) => ai.aiGenerateTable(p, e) });
	p.addCommand({ id: 'ai-fill-table', name: 'AI: Fill Table Data', editorCallback: (e: Editor) => ai.aiFillTableData(p, e) });
	p.addCommand({ id: 'ai-calc-column', name: 'AI: Add Calculated Column', editorCallback: (e: Editor) => ai.aiAddCalculatedColumn(p, e) });
}
