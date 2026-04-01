import type { ArcadiaPluginInterface, EditorContext } from '../types';
import { COMMON_SYMBOLS as SYMBOLS } from '../types';
import { createButton } from '../components/button';
import { addGroup } from '../components/group';
import { createDropdownTrigger, positionDropdown, closeDropdowns } from '../components/dropdown';
import {
	insertLink,
	insertInternalLink,
	insertImage,
	insertTable,
	insertCodeBlock,
	insertHorizontalRule,
	insertCallout,
	insertFootnote,
	insertDate,
	insertDateTime,
	insertLatexBlock,
	insertInlineMath,
	insertFileEmbed,
	insertPdfEmbed,
	insertAudioVideoEmbed,
	insertMermaidBlock,
	insertComment,
} from '../features/editor-commands';

export function buildInsertTab(plugin: ArcadiaPluginInterface, container: HTMLElement, ctx: EditorContext | null): void {
	// ---- Links group ----
	const linkBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'link',
			tooltip: 'Insert external link',
			action: () => ctx && insertLink(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'file-symlink',
			tooltip: 'Insert internal link',
			action: () => ctx && insertInternalLink(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'footnote',
			tooltip: 'Insert footnote',
			action: () => ctx && insertFootnote(ctx.editor),
		}),
	];
	addGroup(container, 'Links', linkBtns);

	// ---- Media group ----
	const mediaBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'image',
			tooltip: 'Insert image',
			action: () => ctx && insertImage(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'paperclip',
			tooltip: 'Embed file',
			action: () => ctx && insertFileEmbed(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'file-text',
			tooltip: 'Embed PDF',
			action: () => ctx && insertPdfEmbed(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'film',
			tooltip: 'Embed audio/video',
			action: () => ctx && insertAudioVideoEmbed(ctx.editor),
		}),
	];
	addGroup(container, 'Media', mediaBtns);

	// ---- Table group ----
	const tableBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'table',
			tooltip: 'Insert table',
			action: () => ctx && insertTable(ctx.editor),
		}),
	];
	addGroup(container, 'Table', tableBtns);

	// ---- Code group ----
	const codeBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'code',
			tooltip: 'Insert code block',
			action: () => ctx && insertCodeBlock(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'terminal',
			tooltip: 'Insert Mermaid diagram',
			action: () => ctx && insertMermaidBlock(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'message-square',
			tooltip: 'Insert comment',
			action: () => ctx && insertComment(ctx.editor),
		}),
	];
	addGroup(container, 'Code', codeBtns);

	// ---- Elements group ----
	const elementsBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'minus',
			tooltip: 'Horizontal rule',
			action: () => ctx && insertHorizontalRule(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'info',
			tooltip: 'Insert callout',
			action: () => ctx && insertCallout(ctx.editor),
		}),
	];
	addGroup(container, 'Elements', elementsBtns);

	// ---- Date group ----
	const dateBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'calendar',
			tooltip: 'Insert date',
			action: () => ctx && insertDate(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'clock',
			tooltip: 'Insert date and time',
			action: () => ctx && insertDateTime(ctx.editor),
		}),
	];
	addGroup(container, 'Date', dateBtns);

	// ---- Templates group ----
	const templatesBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'layout-template',
			tooltip: 'Insert template (Templater)',
			pluginId: 'templater-obsidian',
			action: () => plugin.executeCommand('templater-obsidian:insert-templater'),
		}),
	];
	addGroup(container, 'Templates', templatesBtns);

	// ---- Math group ----
	const mathBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'sigma',
			tooltip: 'Insert LaTeX block',
			action: () => ctx && insertLatexBlock(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'function-square',
			tooltip: 'Insert inline math',
			action: () => ctx && insertInlineMath(ctx.editor),
		}),
	];
	const symbolsTrigger = createDropdownTrigger({
		icon: 'omega',
		tooltip: 'Insert symbol',
		openFn: (wrapper) => openSymbolsDropdown(plugin, wrapper, ctx),
	});
	mathBtns.push(symbolsTrigger);
	addGroup(container, 'Math', mathBtns);

	// ---- Embeds group ----
	const embedBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'layout-grid',
			tooltip: 'Embed note',
			action: () => ctx && insertFileEmbed(ctx.editor),
		}),
	];
	addGroup(container, 'Embeds', embedBtns);
}

function openSymbolsDropdown(plugin: ArcadiaPluginInterface, anchor: HTMLElement, ctx: EditorContext | null): void {
	closeDropdowns(plugin);

	const dropdown = document.createElement('div');
	dropdown.className = 'arcadia-dropdown-menu arcadia-symbols-dropdown';

	const title = document.createElement('div');
	title.className = 'arcadia-dropdown-title';
	title.textContent = 'Insert symbol';
	dropdown.appendChild(title);

	const grid = document.createElement('div');
	grid.className = 'arcadia-symbol-grid';

	for (const sym of SYMBOLS) {
		const btn = document.createElement('button');
		btn.className = 'arcadia-symbol-btn';
		btn.setAttribute('title', sym.name);

		const charSpan = document.createElement('span');
		charSpan.textContent = sym.char;
		btn.appendChild(charSpan);

		btn.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (ctx) {
				ctx.editor.replaceRange(sym.char, ctx.editor.getCursor());
			}
			closeDropdowns(plugin);
		});
		grid.appendChild(btn);
	}

	dropdown.appendChild(grid);
	positionDropdown(plugin, dropdown, anchor);
}
