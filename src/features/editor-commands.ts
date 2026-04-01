import { Editor, Notice } from 'obsidian';
import type { ArcadiaPluginInterface } from '../types';

// ============================================================================
// TEXT FORMATTING
// ============================================================================

export function toggleWrap(editor: Editor, wrapper: string): void {
	const selection = editor.getSelection();
	if (selection) {
		if (selection.startsWith(wrapper) && selection.endsWith(wrapper) && selection.length > wrapper.length * 2) {
			editor.replaceSelection(selection.slice(wrapper.length, -wrapper.length));
		} else {
			editor.replaceSelection(`${wrapper}${selection}${wrapper}`);
		}
	} else {
		const cursor = editor.getCursor();
		editor.replaceRange(`${wrapper}${wrapper}`, cursor);
		editor.setCursor({ line: cursor.line, ch: cursor.ch + wrapper.length });
	}
}

export function toggleHtmlWrap(editor: Editor, tag: string): void {
	const selection = editor.getSelection();
	const open = `<${tag}>`;
	const close = `</${tag}>`;
	if (selection) {
		if (selection.startsWith(open) && selection.endsWith(close)) {
			editor.replaceSelection(selection.slice(open.length, -close.length));
		} else {
			editor.replaceSelection(`${open}${selection}${close}`);
		}
	} else {
		const cursor = editor.getCursor();
		editor.replaceRange(`${open}${close}`, cursor);
		editor.setCursor({ line: cursor.line, ch: cursor.ch + open.length });
	}
}

export function clearFormatting(editor: Editor): void {
	const selection = editor.getSelection();
	if (!selection) return;
	const cleaned = selection
		.replace(/\*\*(.+?)\*\*/g, '$1')
		.replace(/\*(.+?)\*/g, '$1')
		.replace(/~~(.+?)~~/g, '$1')
		.replace(/==(.+?)==/g, '$1')
		.replace(/`(.+?)`/g, '$1')
		.replace(/<u>(.+?)<\/u>/g, '$1')
		.replace(/<sub>(.+?)<\/sub>/g, '$1')
		.replace(/<sup>(.+?)<\/sup>/g, '$1')
		.replace(/<mark[^>]*>(.+?)<\/mark>/g, '$1')
		.replace(/<font[^>]*>(.+?)<\/font>/g, '$1')
		.replace(/<p align="[^"]*">(.+?)<\/p>/g, '$1');
	editor.replaceSelection(cleaned);
}

// ============================================================================
// COLOR COMMANDS
// ============================================================================

export function applyFontColor(plugin: ArcadiaPluginInterface, editor: Editor, color: string): void {
	const selection = editor.getSelection();
	plugin.settings.lastFontColor = color;
	void plugin.saveSettings();
	if (selection) {
		editor.replaceSelection(`<font color="${color}">${selection}</font>`);
	} else {
		const cursor = editor.getCursor();
		editor.replaceRange(`<font color="${color}"></font>`, cursor);
		editor.setCursor({ line: cursor.line, ch: cursor.ch + 22 });
	}
}

export function applyBackgroundColor(plugin: ArcadiaPluginInterface, editor: Editor, color: string): void {
	const selection = editor.getSelection();
	plugin.settings.lastBackgroundColor = color;
	void plugin.saveSettings();
	if (color === 'transparent') {
		if (selection) {
			editor.replaceSelection(selection.replace(/<mark[^>]*>([^<]*)<\/mark>/g, '$1'));
		}
	} else if (selection) {
		editor.replaceSelection(`<mark style="background:${color}">${selection}</mark>`);
	} else {
		const cursor = editor.getCursor();
		editor.replaceRange(`<mark style="background:${color}"></mark>`, cursor);
		editor.setCursor({ line: cursor.line, ch: cursor.ch + 30 + color.length });
	}
}

// ============================================================================
// HEADING COMMANDS
// ============================================================================

export function insertHeading(editor: Editor, level: number): void {
	const cursor = editor.getCursor();
	const line = editor.getLine(cursor.line);
	const prefix = '#'.repeat(level) + ' ';
	const match = line.match(/^(#{1,6})\s/);
	if (match) {
		editor.setLine(cursor.line, prefix + line.slice(match[0].length));
	} else {
		editor.setLine(cursor.line, prefix + line);
	}
}

export function removeHeading(editor: Editor): void {
	const cursor = editor.getCursor();
	const line = editor.getLine(cursor.line);
	const match = line.match(/^#{1,6}\s/);
	if (match) {
		editor.setLine(cursor.line, line.slice(match[0].length));
	}
}

// ============================================================================
// LIST / PARAGRAPH COMMANDS
// ============================================================================

export function toggleBulletList(editor: Editor): void {
	const cursor = editor.getCursor();
	const line = editor.getLine(cursor.line);
	if (line.match(/^(\s*)- /)) {
		editor.setLine(cursor.line, line.replace(/^(\s*)- /, '$1'));
	} else if (line.match(/^(\s*)\d+\. /)) {
		editor.setLine(cursor.line, line.replace(/^(\s*)\d+\. /, '$1- '));
	} else if (line.match(/^(\s*)- \[[ x]\] /)) {
		editor.setLine(cursor.line, line.replace(/^(\s*)- \[[ x]\] /, '$1- '));
	} else {
		const indent = line.match(/^(\s*)/)?.[0] || '';
		editor.setLine(cursor.line, indent + '- ' + line.trimStart());
	}
}

export function toggleNumberedList(editor: Editor): void {
	const cursor = editor.getCursor();
	const line = editor.getLine(cursor.line);
	if (line.match(/^(\s*)\d+\. /)) {
		editor.setLine(cursor.line, line.replace(/^(\s*)\d+\. /, '$1'));
	} else if (line.match(/^(\s*)- /)) {
		editor.setLine(cursor.line, line.replace(/^(\s*)- /, '$11. '));
	} else {
		const indent = line.match(/^(\s*)/)?.[0] || '';
		editor.setLine(cursor.line, indent + '1. ' + line.trimStart());
	}
}

export function toggleChecklist(editor: Editor): void {
	const cursor = editor.getCursor();
	const line = editor.getLine(cursor.line);
	if (line.match(/^(\s*)- \[ \] /)) {
		editor.setLine(cursor.line, line.replace(/^(\s*)- \[ \] /, '$1- [x] '));
	} else if (line.match(/^(\s*)- \[x\] /i)) {
		editor.setLine(cursor.line, line.replace(/^(\s*)- \[x\] /i, '$1'));
	} else if (line.match(/^(\s*)- /)) {
		editor.setLine(cursor.line, line.replace(/^(\s*)- /, '$1- [ ] '));
	} else {
		const indent = line.match(/^(\s*)/)?.[0] || '';
		editor.setLine(cursor.line, indent + '- [ ] ' + line.trimStart());
	}
}

export function toggleBlockquote(editor: Editor): void {
	const cursor = editor.getCursor();
	const line = editor.getLine(cursor.line);
	if (line.startsWith('> ')) {
		editor.setLine(cursor.line, line.slice(2));
	} else {
		editor.setLine(cursor.line, '> ' + line);
	}
}

export function indent(editor: Editor): void {
	const cursor = editor.getCursor();
	const line = editor.getLine(cursor.line);
	editor.setLine(cursor.line, '\t' + line);
	editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
}

export function outdent(editor: Editor): void {
	const cursor = editor.getCursor();
	const line = editor.getLine(cursor.line);
	if (line.startsWith('\t')) {
		editor.setLine(cursor.line, line.slice(1));
		editor.setCursor({ line: cursor.line, ch: Math.max(0, cursor.ch - 1) });
	} else if (line.startsWith('    ')) {
		editor.setLine(cursor.line, line.slice(4));
		editor.setCursor({ line: cursor.line, ch: Math.max(0, cursor.ch - 4) });
	}
}

export function setAlignment(editor: Editor, alignment: string): void {
	const cursor = editor.getCursor();
	const line = editor.getLine(cursor.line);
	const match = line.match(/^<p align="[^"]*">(.*)<\/p>$/);
	if (match) {
		editor.setLine(cursor.line, `<p align="${alignment}">${match[1]}</p>`);
	} else {
		editor.setLine(cursor.line, `<p align="${alignment}">${line}</p>`);
	}
}

// ============================================================================
// INSERT COMMANDS
// ============================================================================

export function insertLink(editor: Editor): void {
	const selection = editor.getSelection();
	if (selection) {
		editor.replaceSelection(`[${selection}](url)`);
	} else {
		const cursor = editor.getCursor();
		editor.replaceRange('[](url)', cursor);
		editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
	}
}

export function insertInternalLink(editor: Editor): void {
	const selection = editor.getSelection();
	if (selection) {
		editor.replaceSelection(`[[${selection}]]`);
	} else {
		const cursor = editor.getCursor();
		editor.replaceRange('[[]]', cursor);
		editor.setCursor({ line: cursor.line, ch: cursor.ch + 2 });
	}
}

export function insertImage(editor: Editor): void {
	const selection = editor.getSelection();
	if (selection) {
		editor.replaceSelection(`![${selection}](image-url)`);
	} else {
		const cursor = editor.getCursor();
		editor.replaceRange('![alt text](image-url)', cursor);
		editor.setSelection(
			{ line: cursor.line, ch: cursor.ch + 2 },
			{ line: cursor.line, ch: cursor.ch + 10 }
		);
	}
}

export function insertTable(editor: Editor): void {
	const cursor = editor.getCursor();
	const table = '\n| Header 1 | Header 2 | Header 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n';
	editor.replaceRange(table, cursor);
	editor.setCursor({ line: cursor.line + 1, ch: 2 });
}

export function insertCodeBlock(editor: Editor): void {
	const selection = editor.getSelection();
	const cursor = editor.getCursor();
	if (selection) {
		editor.replaceSelection(`\`\`\`\n${selection}\n\`\`\``);
	} else {
		editor.replaceRange('```\n\n```', cursor);
		editor.setCursor({ line: cursor.line + 1, ch: 0 });
	}
}

export function insertHorizontalRule(editor: Editor): void {
	const cursor = editor.getCursor();
	const line = editor.getLine(cursor.line);
	if (line.trim() === '') {
		editor.setLine(cursor.line, '---');
	} else {
		editor.replaceRange('\n\n---\n\n', { line: cursor.line, ch: line.length });
		editor.setCursor({ line: cursor.line + 4, ch: 0 });
	}
}

export function insertCallout(editor: Editor): void {
	const cursor = editor.getCursor();
	editor.replaceRange('> [!note] Title\n> Content goes here...\n', cursor);
	editor.setCursor({ line: cursor.line, ch: 10 });
}

export function insertFootnote(editor: Editor): void {
	const text = editor.getValue();
	const footnotePattern = /\[\^(\d+)\]/g;
	let maxNum = 0;
	let match;
	while ((match = footnotePattern.exec(text)) !== null) {
		maxNum = Math.max(maxNum, parseInt(match[1]));
	}
	const num = maxNum + 1;
	const cursor = editor.getCursor();
	editor.replaceRange(`[^${num}]`, cursor);
	const lastLine = editor.lastLine();
	const lastLineText = editor.getLine(lastLine);
	const suffix = lastLineText.trim() === '' ? '' : '\n';
	editor.replaceRange(`${suffix}\n[^${num}]: `, { line: lastLine, ch: lastLineText.length });
}

export function insertDate(editor: Editor): void {
	const now = new Date();
	const date = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
	editor.replaceRange(date, editor.getCursor());
}

export function insertDateTime(editor: Editor): void {
	const now = new Date();
	const date = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
	const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
	editor.replaceRange(`${date} ${time}`, editor.getCursor());
}

export function insertLatexBlock(editor: Editor): void {
	const cursor = editor.getCursor();
	editor.replaceRange('$$\n\n$$', cursor);
	editor.setCursor({ line: cursor.line + 1, ch: 0 });
}

export function insertInlineMath(editor: Editor): void {
	const selection = editor.getSelection();
	if (selection) {
		editor.replaceSelection(`$${selection}$`);
	} else {
		const cursor = editor.getCursor();
		editor.replaceRange('$$', cursor);
		editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
	}
}

export function insertFileEmbed(editor: Editor): void {
	const cursor = editor.getCursor();
	editor.replaceRange('![[]]', cursor);
	editor.setCursor({ line: cursor.line, ch: cursor.ch + 3 });
}

export function insertPdfEmbed(editor: Editor): void {
	const cursor = editor.getCursor();
	editor.replaceRange('![[filename.pdf]]', cursor);
	editor.setSelection(
		{ line: cursor.line, ch: cursor.ch + 3 },
		{ line: cursor.line, ch: cursor.ch + 15 }
	);
}

export function insertAudioVideoEmbed(editor: Editor): void {
	const cursor = editor.getCursor();
	editor.replaceRange('![[media-file]]', cursor);
	editor.setSelection(
		{ line: cursor.line, ch: cursor.ch + 3 },
		{ line: cursor.line, ch: cursor.ch + 13 }
	);
}

export function insertMermaidBlock(editor: Editor): void {
	const cursor = editor.getCursor();
	editor.replaceRange('```mermaid\ngraph TD\n    A --> B\n```\n', cursor);
	editor.setCursor({ line: cursor.line + 1, ch: 0 });
}

export function insertPlantUMLBlock(editor: Editor): void {
	const cursor = editor.getCursor();
	editor.replaceRange('```plantuml\n@startuml\nAlice -> Bob: Hello\n@enduml\n```\n', cursor);
	editor.setCursor({ line: cursor.line + 2, ch: 0 });
}

export function insertComment(editor: Editor): void {
	const sel = editor.getSelection();
	if (sel) {
		editor.replaceSelection(`%%${sel}%%`);
		new Notice('Comment inserted');
	} else {
		const cursor = editor.getCursor();
		editor.replaceRange('%%comment%%', cursor);
		editor.setCursor({ line: cursor.line, ch: cursor.ch + 2 });
		new Notice('Comment block inserted');
	}
}

// ============================================================================
// THEOLOGY COMMANDS
// ============================================================================

export function insertScriptureBlock(plugin: ArcadiaPluginInterface, editor: Editor): void {
	const cursor = editor.getCursor();
	const t = plugin.settings.scriptureTranslation;
	editor.replaceRange(
		`> [!scripture] Scripture Reference\n> **Book Chapter:Verse (${t})**\n>\n> Enter scripture text here...\n`,
		cursor
	);
	editor.setCursor({ line: cursor.line + 1, ch: 3 });
}

export function insertCrossReference(editor: Editor): void {
	const selection = editor.getSelection();
	if (selection) {
		editor.replaceSelection(`<span class="cross-ref" title="Cross Reference">${selection}</span>`);
	} else {
		const cursor = editor.getCursor();
		editor.replaceRange('<span class="cross-ref" title="Cross Reference">ref</span>', cursor);
	}
}

export function insertVerseHighlight(editor: Editor): void {
	const selection = editor.getSelection();
	if (selection) {
		editor.replaceSelection(`<span class="verse-highlight">${selection}</span>`);
	} else {
		const cursor = editor.getCursor();
		editor.replaceRange('<span class="verse-highlight"></span>', cursor);
		editor.setCursor({ line: cursor.line, ch: cursor.ch + 33 });
	}
}

export function insertCommentaryNote(editor: Editor): void {
	const cursor = editor.getCursor();
	editor.replaceRange(
		`> [!note] Commentary\n> **Source:** \n> **Page/Section:** \n>\n> Commentary text...\n`,
		cursor
	);
	editor.setCursor({ line: cursor.line + 1, ch: 14 });
}

export function insertLanguageNote(editor: Editor): void {
	const cursor = editor.getCursor();
	editor.replaceRange(
		`> [!info] Original Language\n> **Word:** \n> **Transliteration:** \n> **Strong's:** \n> **Meaning:** \n`,
		cursor
	);
	editor.setCursor({ line: cursor.line + 1, ch: 11 });
}

// ============================================================================
// CITATION COMMANDS
// ============================================================================

export function insertCitationFootnote(editor: Editor, styleKey: string): void {
	const style = CITATION_STYLES_LOCAL[styleKey];
	if (!style) return;

	const text = editor.getValue();
	const footnotePattern = /\[\^(\d+)\]/g;
	let maxNum = 0;
	let match;
	while ((match = footnotePattern.exec(text)) !== null) {
		maxNum = Math.max(maxNum, parseInt(match[1]));
	}
	const num = maxNum + 1;

	const cursor = editor.getCursor();
	editor.replaceRange(`[^${num}]`, cursor);

	const lastLine = editor.lastLine();
	const lastLineText = editor.getLine(lastLine);
	const suffix = lastLineText.trim() === '' ? '' : '\n';
	editor.replaceRange(
		`${suffix}\n[^${num}]: ${style.template}`,
		{ line: lastLine, ch: lastLineText.length }
	);

	new Notice(`${style.name} footnote [^${num}] inserted`);
}

export function insertInlineCitation(editor: Editor, styleKey: string): void {
	const style = CITATION_STYLES_LOCAL[styleKey];
	if (!style) return;

	const cursor = editor.getCursor();
	editor.replaceRange(style.template, cursor);
	const endCh = cursor.ch + style.template.length;
	editor.setSelection(cursor, { line: cursor.line, ch: endCh });
}

export function generateBibliography(editor: Editor): void {
	const text = editor.getValue();

	const footnoteDefPattern = /^\[\^(\d+)\]:\s*(.+)$/gm;
	const entries: { num: number; text: string }[] = [];
	let match;
	while ((match = footnoteDefPattern.exec(text)) !== null) {
		entries.push({ num: parseInt(match[1]), text: match[2].trim() });
	}

	if (entries.length === 0) {
		new Notice('No footnotes found to generate bibliography');
		return;
	}

	const sorted = [...entries].sort((a, b) => a.text.localeCompare(b.text));

	let bib = '\n\n---\n\n## Bibliography\n\n';
	for (const entry of sorted) {
		bib += `${entry.text}\n\n`;
	}

	const bibIdx = text.indexOf('## Bibliography');
	if (bibIdx !== -1) {
		const afterBib = text.substring(bibIdx);
		const nextSection = afterBib.indexOf('\n## ', 4);
		const endPos = nextSection !== -1
			? editor.offsetToPos(bibIdx + nextSection)
			: { line: editor.lastLine(), ch: editor.getLine(editor.lastLine()).length };
		const startPos = editor.offsetToPos(bibIdx);
		let replacement = '## Bibliography\n\n';
		for (const entry of sorted) {
			replacement += `${entry.text}\n\n`;
		}
		editor.replaceRange(replacement, startPos, endPos);
		new Notice(`Bibliography updated with ${sorted.length} entries`);
	} else {
		const lastLine = editor.lastLine();
		const lastLineText = editor.getLine(lastLine);
		editor.replaceRange(bib, { line: lastLine, ch: lastLineText.length });
		new Notice(`Bibliography generated with ${sorted.length} entries`);
	}
}

// Local reference to avoid circular import
import { CITATION_STYLES } from '../types';
const CITATION_STYLES_LOCAL = CITATION_STYLES;
