import type { ArcadiaPluginInterface, EditorContext } from '../types';
import { SLIDE_LAYOUTS } from '../types';
import { createButton } from '../components/button';
import { addGroup } from '../components/group';
import { createDropdownTrigger, positionDropdown, closeDropdowns } from '../components/dropdown';
import {
	navigateSlide,
	insertSlideSeparator,
	insertSpeakerNotes,
	insertSlideColumns,
	insertSlideGrid,
	insertSlideFragment,
	insertSlideBackground,
	insertSlideThemeFrontmatter,
} from '../features/slide-operations';
import { aiNotesToSlides } from '../features/ai-integration';
import { setIcon } from 'obsidian';

// Slide themes available in Advanced Slides / Reveal.js
const SLIDE_THEMES = [
	{ name: 'Black', value: 'black', icon: 'moon' },
	{ name: 'White', value: 'white', icon: 'sun' },
	{ name: 'League', value: 'league', icon: 'award' },
	{ name: 'Beige', value: 'beige', icon: 'coffee' },
	{ name: 'Sky', value: 'sky', icon: 'cloud' },
	{ name: 'Night', value: 'night', icon: 'star' },
	{ name: 'Serif', value: 'serif', icon: 'type' },
	{ name: 'Simple', value: 'simple', icon: 'square' },
	{ name: 'Solarized', value: 'solarized', icon: 'sun' },
	{ name: 'Blood', value: 'blood', icon: 'droplets' },
	{ name: 'Moon', value: 'moon', icon: 'moon' },
];

export function buildSlidesTab(plugin: ArcadiaPluginInterface, container: HTMLElement, ctx: EditorContext | null): void {
	// ---- Presentation group ----
	const presentBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'presentation',
			tooltip: 'Start presentation (Advanced Slides)',
			pluginId: 'obsidian-advanced-slides',
			action: () => plugin.executeCommand('obsidian-advanced-slides:start-server'),
		}),
		createButton(plugin, {
			icon: 'stop-circle',
			tooltip: 'Stop presentation server',
			pluginId: 'obsidian-advanced-slides',
			action: () => plugin.executeCommand('obsidian-advanced-slides:stop-server'),
		}),
		createButton(plugin, {
			icon: 'refresh-cw',
			tooltip: 'Reload presentation',
			pluginId: 'obsidian-advanced-slides',
			action: () => plugin.executeCommand('obsidian-advanced-slides:reload-server'),
		}),
	];
	addGroup(container, 'Presentation', presentBtns);

	// ---- Navigate group ----
	const navBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'chevron-left',
			tooltip: 'Previous slide',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) navigateSlide(activeCtx.editor, 'prev');
			},
		}),
		createButton(plugin, {
			icon: 'chevron-right',
			tooltip: 'Next slide',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) navigateSlide(activeCtx.editor, 'next');
			},
		}),
	];
	addGroup(container, 'Navigate', navBtns);

	// ---- Slide Editing group ----
	const editBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'separator-horizontal',
			tooltip: 'Insert slide break (---)',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) insertSlideSeparator(activeCtx.editor);
			},
		}),
		createButton(plugin, {
			icon: 'message-square',
			tooltip: 'Insert speaker notes',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) insertSpeakerNotes(activeCtx.editor);
			},
		}),
		createButton(plugin, {
			icon: 'image',
			tooltip: 'Insert slide background',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) insertSlideBackground(activeCtx.editor);
			},
		}),
		createButton(plugin, {
			icon: 'zap',
			tooltip: 'Insert fragment (animate)',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) insertSlideFragment(activeCtx.editor);
			},
		}),
	];
	addGroup(container, 'Slide editing', editBtns);

	// ---- Layouts dropdown ----
	const layoutTrigger = createDropdownTrigger({
		icon: 'layout',
		tooltip: 'Slide layouts',
		label: 'Layouts',
		openFn: (wrapper) => openLayoutsDropdown(plugin, wrapper, ctx),
	});
	addGroup(container, 'Layouts', [layoutTrigger]);

	// ---- Elements group ----
	const elementBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'columns',
			tooltip: 'Insert two-column layout',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) insertSlideColumns(activeCtx.editor);
			},
		}),
		createButton(plugin, {
			icon: 'grid',
			tooltip: 'Insert grid layout',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) insertSlideGrid(activeCtx.editor);
			},
		}),
	];
	addGroup(container, 'Elements', elementBtns);

	// ---- Themes dropdown ----
	const themeTrigger = createDropdownTrigger({
		icon: 'palette',
		tooltip: 'Slide themes',
		label: 'Themes',
		openFn: (wrapper) => openThemesDropdown(plugin, wrapper, ctx),
	});
	addGroup(container, 'Themes', [themeTrigger]);

	// ---- AI Tools group (premium) ----
	const aiBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'sparkles',
			tooltip: 'Convert notes to slides (AI)',
			requiresAI: true,
			requiresPremium: true,
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) void aiNotesToSlides(plugin, activeCtx.editor);
			},
		}),
	];
	addGroup(container, 'AI tools', aiBtns);
}

function openLayoutsDropdown(plugin: ArcadiaPluginInterface, anchor: HTMLElement, ctx: EditorContext | null): void {
	closeDropdowns(plugin);

	const dropdown = createDiv({ cls: 'arcadia-dropdown-menu' });

	dropdown.createDiv({ cls: 'arcadia-dropdown-title', text: 'Slide layouts' });

	for (const layout of SLIDE_LAYOUTS) {
		const item = dropdown.createEl('button', { cls: 'arcadia-dropdown-item' });

		const iconSpan = item.createSpan();
		setIcon(iconSpan, layout.icon);

		item.createSpan({ text: layout.name });

		item.createSpan({ cls: 'arcadia-dropdown-item-hint', text: layout.desc });

		item.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			const activeCtx = ctx || plugin.getActiveEditor();
			if (activeCtx) {
				activeCtx.editor.replaceRange(layout.template, activeCtx.editor.getCursor());
			}
			closeDropdowns(plugin);
		});
	}

	positionDropdown(plugin, dropdown, anchor);
}

function openThemesDropdown(plugin: ArcadiaPluginInterface, anchor: HTMLElement, ctx: EditorContext | null): void {
	closeDropdowns(plugin);

	const dropdown = createDiv({ cls: 'arcadia-dropdown-menu' });

	dropdown.createDiv({ cls: 'arcadia-dropdown-title', text: 'Slide theme' });

	for (const theme of SLIDE_THEMES) {
		const item = dropdown.createEl('button', { cls: 'arcadia-dropdown-item' });

		const iconSpan = item.createSpan();
		setIcon(iconSpan, theme.icon);

		item.createSpan({ text: theme.name });

		item.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			const activeCtx = ctx || plugin.getActiveEditor();
			if (activeCtx) {
				insertSlideThemeFrontmatter(activeCtx.editor, theme.value);
			}
			closeDropdowns(plugin);
		});
	}

	positionDropdown(plugin, dropdown, anchor);
}
