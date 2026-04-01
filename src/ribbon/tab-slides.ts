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
			tooltip: 'Insert fragment (Animate)',
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
			tooltip: 'Insert two-Column layout',
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

	// ---- AI Tools group ----
	const aiBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'sparkles',
			tooltip: 'Convert notes to Slides (AI)',
			requiresAI: true,
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

	const dropdown = document.createElement('div');
	dropdown.className = 'arcadia-dropdown-menu';

	const title = document.createElement('div');
	title.className = 'arcadia-dropdown-title';
	title.textContent = 'Slide layouts';
	dropdown.appendChild(title);

	for (const layout of SLIDE_LAYOUTS) {
		const item = document.createElement('button');
		item.className = 'arcadia-dropdown-item';

		const iconSpan = document.createElement('span');
		setIcon(iconSpan, layout.icon);
		item.appendChild(iconSpan);

		const nameSpan = document.createElement('span');
		nameSpan.textContent = layout.name;
		item.appendChild(nameSpan);

		const descSpan = document.createElement('span');
		descSpan.className = 'arcadia-dropdown-item-hint';
		descSpan.textContent = layout.desc;
		item.appendChild(descSpan);

		item.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			const activeCtx = ctx || plugin.getActiveEditor();
			if (activeCtx) {
				activeCtx.editor.replaceRange(layout.template, activeCtx.editor.getCursor());
			}
			closeDropdowns(plugin);
		});

		dropdown.appendChild(item);
	}

	positionDropdown(plugin, dropdown, anchor);
}

function openThemesDropdown(plugin: ArcadiaPluginInterface, anchor: HTMLElement, ctx: EditorContext | null): void {
	closeDropdowns(plugin);

	const dropdown = document.createElement('div');
	dropdown.className = 'arcadia-dropdown-menu';

	const title = document.createElement('div');
	title.className = 'arcadia-dropdown-title';
	title.textContent = 'Slide theme';
	dropdown.appendChild(title);

	for (const theme of SLIDE_THEMES) {
		const item = document.createElement('button');
		item.className = 'arcadia-dropdown-item';

		const iconSpan = document.createElement('span');
		setIcon(iconSpan, theme.icon);
		item.appendChild(iconSpan);

		const nameSpan = document.createElement('span');
		nameSpan.textContent = theme.name;
		item.appendChild(nameSpan);

		item.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			const activeCtx = ctx || plugin.getActiveEditor();
			if (activeCtx) {
				insertSlideThemeFrontmatter(activeCtx.editor, theme.value);
			}
			closeDropdowns(plugin);
		});

		dropdown.appendChild(item);
	}

	positionDropdown(plugin, dropdown, anchor);
}
