import type { ArcadiaPluginInterface, EditorContext } from '../types';
import { createButton } from '../components/button';
import { addGroup } from '../components/group';
import { createDropdownTrigger, positionDropdown, closeDropdowns } from '../components/dropdown';
import { addColorButton } from '../components/color-picker';
import {
	toggleWrap,
	toggleHtmlWrap,
	clearFormatting,
	insertHeading,
	removeHeading,
	toggleBulletList,
	toggleNumberedList,
	toggleChecklist,
	toggleBlockquote,
	indent,
	outdent,
	setAlignment,
} from '../features/editor-commands';
import { setIcon } from 'obsidian';

export function buildHomeTab(plugin: ArcadiaPluginInterface, container: HTMLElement, ctx: EditorContext | null): void {
	// ---- Clipboard group ----
	const clipboardBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'undo',
			tooltip: 'Undo',
			action: () => plugin.executeCommand('editor:undo'),
		}),
		createButton(plugin, {
			icon: 'redo',
			tooltip: 'Redo',
			action: () => plugin.executeCommand('editor:redo'),
		}),
	];
	addGroup(container, 'Clipboard', clipboardBtns);

	// ---- Font group ----
	const fontBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'bold',
			tooltip: 'Bold',
			action: () => ctx && toggleWrap(ctx.editor, '**'),
		}),
		createButton(plugin, {
			icon: 'italic',
			tooltip: 'Italic',
			action: () => ctx && toggleWrap(ctx.editor, '*'),
		}),
		createButton(plugin, {
			icon: 'underline',
			tooltip: 'Underline',
			action: () => ctx && toggleHtmlWrap(ctx.editor, 'u'),
		}),
		createButton(plugin, {
			icon: 'strikethrough',
			tooltip: 'Strikethrough',
			action: () => ctx && toggleWrap(ctx.editor, '~~'),
		}),
		createButton(plugin, {
			icon: 'highlighter',
			tooltip: 'Highlight',
			action: () => ctx && toggleWrap(ctx.editor, '=='),
		}),
		createButton(plugin, {
			icon: 'subscript',
			tooltip: 'Subscript',
			action: () => ctx && toggleHtmlWrap(ctx.editor, 'sub'),
		}),
		createButton(plugin, {
			icon: 'superscript',
			tooltip: 'Superscript',
			action: () => ctx && toggleHtmlWrap(ctx.editor, 'sup'),
		}),
		createButton(plugin, {
			icon: 'remove-formatting',
			tooltip: 'Clear Formatting',
			action: () => ctx && clearFormatting(ctx.editor),
		}),
	];
	const fontGroup = addGroup(container, 'Font', fontBtns);

	// Color buttons are appended directly into fontGroup's buttons row
	if (ctx) {
		addColorButton(
			plugin,
			fontGroup,
			'font-color',
			'type',
			'Font Color',
			plugin.settings.lastFontColor,
			ctx
		);
		addColorButton(
			plugin,
			fontGroup,
			'bg-color',
			'paintbrush',
			'Background Color',
			plugin.settings.lastBackgroundColor,
			ctx
		);
	}

	// ---- Heading dropdown ----
	const headingTrigger = createDropdownTrigger({
		icon: 'heading',
		tooltip: 'Headings',
		label: 'Heading',
		openFn: (wrapper) => openHeadingDropdown(plugin, wrapper, ctx),
	});
	const headingGroup = addGroup(container, 'Headings', [headingTrigger]);

	// ---- Paragraph group ----
	const paragraphBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'list',
			tooltip: 'Bullet List',
			action: () => ctx && toggleBulletList(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'list-ordered',
			tooltip: 'Numbered List',
			action: () => ctx && toggleNumberedList(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'check-square',
			tooltip: 'Checklist',
			action: () => ctx && toggleChecklist(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'quote',
			tooltip: 'Blockquote',
			action: () => ctx && toggleBlockquote(ctx.editor),
		}),
	];
	addGroup(container, 'Paragraph', paragraphBtns);

	// ---- Indent group ----
	const indentBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'indent',
			tooltip: 'Indent',
			action: () => ctx && indent(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'outdent',
			tooltip: 'Outdent',
			action: () => ctx && outdent(ctx.editor),
		}),
	];
	addGroup(container, 'Indent', indentBtns);

	// ---- Alignment dropdown ----
	const alignTrigger = createDropdownTrigger({
		icon: 'align-left',
		tooltip: 'Text Alignment',
		label: 'Align',
		openFn: (wrapper) => openAlignmentDropdown(plugin, wrapper, ctx),
	});
	addGroup(container, 'Alignment', [alignTrigger]);
}

function openHeadingDropdown(plugin: ArcadiaPluginInterface, anchor: HTMLElement, ctx: EditorContext | null): void {
	closeDropdowns(plugin);

	const dropdown = document.createElement('div');
	dropdown.className = 'arcadia-dropdown-menu';

	const title = document.createElement('div');
	title.className = 'arcadia-dropdown-title';
	title.textContent = 'Heading Style';
	dropdown.appendChild(title);

	const levels: { level: number; label: string }[] = [
		{ level: 1, label: 'Heading 1' },
		{ level: 2, label: 'Heading 2' },
		{ level: 3, label: 'Heading 3' },
		{ level: 4, label: 'Heading 4' },
		{ level: 5, label: 'Heading 5' },
		{ level: 6, label: 'Heading 6' },
	];

	for (const { level, label } of levels) {
		const item = document.createElement('button');
		item.className = 'arcadia-dropdown-item';
		const iconSpan = document.createElement('span');
		setIcon(iconSpan, 'heading');
		item.appendChild(iconSpan);
		const text = document.createElement('span');
		text.textContent = label;
		item.appendChild(text);
		item.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (ctx) insertHeading(ctx.editor, level);
			closeDropdowns(plugin);
		});
		dropdown.appendChild(item);
	}

	const divider = document.createElement('div');
	divider.className = 'arcadia-dropdown-divider';
	dropdown.appendChild(divider);

	const removeItem = document.createElement('button');
	removeItem.className = 'arcadia-dropdown-item';
	const removeIcon = document.createElement('span');
	setIcon(removeIcon, 'x');
	removeItem.appendChild(removeIcon);
	const removeText = document.createElement('span');
	removeText.textContent = 'Remove Heading';
	removeItem.appendChild(removeText);
	removeItem.addEventListener('click', (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (ctx) removeHeading(ctx.editor);
		closeDropdowns(plugin);
	});
	dropdown.appendChild(removeItem);

	positionDropdown(plugin, dropdown, anchor);
}

function openAlignmentDropdown(plugin: ArcadiaPluginInterface, anchor: HTMLElement, ctx: EditorContext | null): void {
	closeDropdowns(plugin);

	const dropdown = document.createElement('div');
	dropdown.className = 'arcadia-dropdown-menu';

	const title = document.createElement('div');
	title.className = 'arcadia-dropdown-title';
	title.textContent = 'Text Alignment';
	dropdown.appendChild(title);

	const alignments: { icon: string; label: string; value: string }[] = [
		{ icon: 'align-left', label: 'Align Left', value: 'left' },
		{ icon: 'align-center', label: 'Align Center', value: 'center' },
		{ icon: 'align-right', label: 'Align Right', value: 'right' },
		{ icon: 'align-justify', label: 'Justify', value: 'justify' },
	];

	for (const { icon, label, value } of alignments) {
		const item = document.createElement('button');
		item.className = 'arcadia-dropdown-item';
		const iconSpan = document.createElement('span');
		setIcon(iconSpan, icon);
		item.appendChild(iconSpan);
		const text = document.createElement('span');
		text.textContent = label;
		item.appendChild(text);
		item.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (ctx) setAlignment(ctx.editor, value);
			closeDropdowns(plugin);
		});
		dropdown.appendChild(item);
	}

	positionDropdown(plugin, dropdown, anchor);
}
