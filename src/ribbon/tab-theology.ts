import type { ArcadiaPluginInterface, EditorContext } from '../types';
import { BIBLE_TRANSLATIONS } from '../types';
import { createButton } from '../components/button';
import { addGroup } from '../components/group';
import { createDropdownTrigger, positionDropdown, closeDropdowns } from '../components/dropdown';
import { PremiumModal } from '../premium-modal';
import {
	insertScriptureBlock,
	insertCrossReference,
	insertVerseHighlight,
	insertCommentaryNote,
	insertLanguageNote,
} from '../features/editor-commands';
import { setIcon } from 'obsidian';

export function buildTheologyTab(plugin: ArcadiaPluginInterface, container: HTMLElement, ctx: EditorContext | null): void {
	// The theology tab is a premium feature
	if (!plugin.isPremium) {
		buildLockedPanel(plugin, container);
		return;
	}
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
			tooltip: 'Insert cross-reference',
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

function buildLockedPanel(plugin: ArcadiaPluginInterface, container: HTMLElement): void {
	const panel = container.createDiv({ cls: 'arcadia-premium-panel' });

	const iconEl = panel.createSpan({ cls: 'arcadia-premium-panel-icon' });
	setIcon(iconEl, 'lock');

	panel.createSpan({
		cls: 'arcadia-premium-panel-text',
		text: 'The theology tab (scripture blocks, hover lookup, commentary) is a premium feature.',
	});

	const unlockBtn = panel.createEl('button', { cls: 'arcadia-btn arcadia-premium-panel-btn', text: 'Unlock premium' });
	unlockBtn.addEventListener('click', (e) => {
		e.preventDefault();
		e.stopPropagation();
		new PremiumModal(plugin.app, plugin, 'Theology tab').open();
	});
}

function openScriptureDropdown(plugin: ArcadiaPluginInterface, anchor: HTMLElement, ctx: EditorContext | null): void {
	closeDropdowns(plugin);

	const dropdown = createDiv({ cls: 'arcadia-dropdown-menu' });

	dropdown.createDiv({ cls: 'arcadia-dropdown-title', text: 'Insert scripture block' });

	// Current translation indicator
	const currentEl = dropdown.createDiv({ cls: 'arcadia-dropdown-subtitle' });
	currentEl.createSpan({ text: `Current: ${plugin.settings.scriptureTranslation}` });

	dropdown.createDiv({ cls: 'arcadia-dropdown-divider' });

	// Insert block with current translation
	const insertItem = dropdown.createEl('button', { cls: 'arcadia-dropdown-item' });
	const insertIcon = insertItem.createSpan();
	setIcon(insertIcon, 'book-open');
	insertItem.createSpan({ text: `Insert block (${plugin.settings.scriptureTranslation})` });
	insertItem.addEventListener('click', (e) => {
		e.preventDefault();
		e.stopPropagation();
		const activeCtx = ctx || plugin.getActiveEditor();
		if (activeCtx) insertScriptureBlock(plugin, activeCtx.editor);
		closeDropdowns(plugin);
	});

	dropdown.createDiv({ cls: 'arcadia-dropdown-divider' });

	// Translation switcher section
	dropdown.createDiv({ cls: 'arcadia-dropdown-section-label', text: 'Switch translation' });

	for (const [abbr, fullName] of Object.entries(BIBLE_TRANSLATIONS)) {
		const item = dropdown.createEl('button', { cls: 'arcadia-dropdown-item' });

		if (abbr === plugin.settings.scriptureTranslation) {
			item.classList.add('arcadia-dropdown-item-active');
		}

		const iconSpan = item.createSpan();
		setIcon(iconSpan, abbr === plugin.settings.scriptureTranslation ? 'check' : 'book');

		item.createSpan({ text: abbr });

		item.createSpan({ cls: 'arcadia-dropdown-item-hint', text: fullName });

		item.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			plugin.settings.scriptureTranslation = abbr;
			void plugin.saveSettings().then(() => {
				plugin.updateToolbar();
				closeDropdowns(plugin);
			});
		});
	}

	positionDropdown(plugin, dropdown, anchor);
}
