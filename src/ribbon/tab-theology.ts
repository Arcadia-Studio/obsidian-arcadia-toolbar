import type { ArcadiaPluginInterface, EditorContext } from '../types';
import { BIBLE_TRANSLATIONS } from '../types';
import { createButton } from '../components/button';
import { addGroup } from '../components/group';
import { createDropdownTrigger, positionDropdown, closeDropdowns } from '../components/dropdown';
import {
	insertScriptureBlock,
	insertCrossReference,
	insertVerseHighlight,
	insertCommentaryNote,
	insertLanguageNote,
} from '../features/editor-commands';
import { setIcon } from 'obsidian';

export function buildTheologyTab(plugin: ArcadiaPluginInterface, container: HTMLElement, ctx: EditorContext | null): void {
	// ---- Scripture dropdown ----
	const scriptureTrigger = createDropdownTrigger({
		icon: 'book-open',
		tooltip: 'Insert scripture block',
		label: 'Scripture',
		openFn: (wrapper) => openScriptureDropdown(plugin, wrapper, ctx),
	});
	addGroup(container, 'Scripture', [scriptureTrigger]);

	// ---- Reference group ----
	const refBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'git-branch',
			tooltip: 'Insert cross-Reference',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) insertCrossReference(activeCtx.editor);
			},
		}),
		createButton(plugin, {
			icon: 'highlighter',
			tooltip: 'Insert verse highlight',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) insertVerseHighlight(activeCtx.editor);
			},
		}),
	];
	addGroup(container, 'Reference', refBtns);

	// ---- Notes group ----
	const notesBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'message-square',
			tooltip: 'Insert commentary note',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) insertCommentaryNote(activeCtx.editor);
			},
		}),
		createButton(plugin, {
			icon: 'languages',
			tooltip: 'Insert language note (Hebrew/Greek)',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) insertLanguageNote(activeCtx.editor);
			},
		}),
	];
	addGroup(container, 'Notes', notesBtns);

	// ---- Hover Lookup Toggles group ----
	const currentMode = plugin.settings.hoverMode;

	const hoverBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'eye-off',
			tooltip: 'Hover lookup: off',
			active: currentMode === 'off',
			action: () => {
				plugin.settings.hoverMode = 'off';
				void plugin.saveSettings().then(() => plugin.updateToolbar());
			},
		}),
		createButton(plugin, {
			icon: 'book',
			tooltip: 'Hover lookup: bible text',
			active: currentMode === 'bible',
			action: () => {
				plugin.settings.hoverMode = 'bible';
				void plugin.saveSettings().then(() => plugin.updateToolbar());
			},
		}),
		createButton(plugin, {
			icon: 'scroll-text',
			tooltip: 'Hover lookup: commentary',
			active: currentMode === 'commentary',
			action: () => {
				plugin.settings.hoverMode = 'commentary';
				void plugin.saveSettings().then(() => plugin.updateToolbar());
			},
		}),
		createButton(plugin, {
			icon: 'library',
			tooltip: 'Hover lookup: dictionary',
			active: currentMode === 'dictionary',
			action: () => {
				plugin.settings.hoverMode = 'dictionary';
				void plugin.saveSettings().then(() => plugin.updateToolbar());
			},
		}),
	];
	addGroup(container, 'Hover lookup', hoverBtns);
}

function openScriptureDropdown(plugin: ArcadiaPluginInterface, anchor: HTMLElement, ctx: EditorContext | null): void {
	closeDropdowns(plugin);

	const dropdown = document.createElement('div');
	dropdown.className = 'arcadia-dropdown-menu';

	const title = document.createElement('div');
	title.className = 'arcadia-dropdown-title';
	title.textContent = 'Insert scripture block';
	dropdown.appendChild(title);

	// Current translation indicator
	const currentEl = document.createElement('div');
	currentEl.className = 'arcadia-dropdown-subtitle';
	const currentLabel = document.createElement('span');
	currentLabel.textContent = `Current: ${plugin.settings.scriptureTranslation}`;
	currentEl.appendChild(currentLabel);
	dropdown.appendChild(currentEl);

	const divider = document.createElement('div');
	divider.className = 'arcadia-dropdown-divider';
	dropdown.appendChild(divider);

	// Insert block with current translation
	const insertItem = document.createElement('button');
	insertItem.className = 'arcadia-dropdown-item';
	const insertIcon = document.createElement('span');
	setIcon(insertIcon, 'book-open');
	insertItem.appendChild(insertIcon);
	const insertText = document.createElement('span');
	insertText.textContent = `Insert Block (${plugin.settings.scriptureTranslation})`;
	insertItem.appendChild(insertText);
	insertItem.addEventListener('click', (e) => {
		e.preventDefault();
		e.stopPropagation();
		const activeCtx = ctx || plugin.getActiveEditor();
		if (activeCtx) insertScriptureBlock(plugin, activeCtx.editor);
		closeDropdowns(plugin);
	});
	dropdown.appendChild(insertItem);

	const divider2 = document.createElement('div');
	divider2.className = 'arcadia-dropdown-divider';
	dropdown.appendChild(divider2);

	// Translation switcher section
	const transTitle = document.createElement('div');
	transTitle.className = 'arcadia-dropdown-section-label';
	transTitle.textContent = 'Switch translation';
	dropdown.appendChild(transTitle);

	for (const [abbr, fullName] of Object.entries(BIBLE_TRANSLATIONS)) {
		const item = document.createElement('button');
		item.className = 'arcadia-dropdown-item';

		if (abbr === plugin.settings.scriptureTranslation) {
			item.classList.add('arcadia-dropdown-item-active');
		}

		const iconSpan = document.createElement('span');
		setIcon(iconSpan, abbr === plugin.settings.scriptureTranslation ? 'check' : 'book');
		item.appendChild(iconSpan);

		const abbrSpan = document.createElement('span');
		abbrSpan.textContent = abbr;
		item.appendChild(abbrSpan);

		const fullSpan = document.createElement('span');
		fullSpan.className = 'arcadia-dropdown-item-hint';
		fullSpan.textContent = fullName;
		item.appendChild(fullSpan);

		item.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			plugin.settings.scriptureTranslation = abbr;
			void plugin.saveSettings().then(() => {
				plugin.updateToolbar();
				closeDropdowns(plugin);
			});
		});

		dropdown.appendChild(item);
	}

	positionDropdown(plugin, dropdown, anchor);
}
