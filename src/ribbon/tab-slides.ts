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
			tooltip: 'Start Presentation (Advanced Slides)',
			pluginId: 'obsidian-advanced-slides',
			action: () => plugin.executeCommand('obsidian-advanced-slides:start-server'),
		}),
		createButton(plugin, {
			icon: 'stop-circle',
			tooltip: 'Stop Presentation Server',
			pluginId: 'obsidian-advanced-slides',
			action: () => plugin.executeCommand('obsidian-advanced-slides:stop-server'),
		}),
		createButton(plugin, {
			icon: 'refresh-cw',
			tooltip: 'Reload Presentation',
			pluginId: 'obsidian-advanced-slides',
			action: () => plugin.executeCommand('obsidian-advanced-slides:reload-server'),
		}),
	];
	addGroup(container, 'Presentation', presentBtns);

	// ---- Navigate group ----
	const navBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'chevron-left',
			tooltip: 'Previous Slide',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) navigateSlide(activeCtx.editor, 'prev');
			},
		}),
		createButton(plugin, {
			icon: 'chevron-right',
			tooltip: 'Next Slide',
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
			tooltip: 'Insert Slide Break (---)',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) insertSlideSeparator(activeCtx.editor);
			},
		}),
		createButton(plugin, {
			icon: 'message-square',
			tooltip: 'Insert Speaker Notes',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) insertSpeakerNotes(activeCtx.editor);
			},
		}),
		createButton(plugin, {
			icon: 'image',
			tooltip: 'Insert Slide Background',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) insertSlideBackground(activeCtx.editor);
			},
		}),
		createButton(plugin, {
			icon: 'zap',
			tooltip: 'Insert Fragment (Animate)',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) insertSlideFragment(activeCtx.editor);
			},
		}),
	];
	addGroup(container, 'Slide Editing', editBtns);

	// ---- Layouts dropdown ----
	const layoutTrigger = createDropdownTrigger({
		icon: 'layout',
		tooltip: 'Slide Layouts',
		label: 'Layouts',
		openFn: (wrapper) => openLayoutsDropdown(plugin, wrapper, ctx),
	});
	addGroup(container, 'Layouts', [layoutTrigger]);

	// ---- Elements group ----
	const elementBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'columns',
			tooltip: 'Insert Two-Column Layout',
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) insertSlideColumns(activeCtx.editor);
			},
		}),
		createButton(plugin, {
			icon: 'grid',
			tooltip: 'Insert Grid Layout',
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
		tooltip: 'Slide Themes',
		label: 'Themes',
		openFn: (wrapper) => openThemesDropdown(plugin, wrapper, ctx),
	});
	addGroup(container, 'Themes', [themeTrigger]);

	// ---- AI Tools group ----
	const aiBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'sparkles',
			tooltip: 'Convert Notes to Slides (AI)',
			requiresAI: true,
			action: () => {
				const activeCtx = ctx || plugin.getActiveEditor();
				if (activeCtx) aiNotesToSlides(plugin, activeCtx.editor);
			},
		}),
	];
	addGroup(container, 'AI Tools', aiBtns);
}

function openLayoutsDropdown(plugin: ArcadiaPluginInterface, anchor: HTMLElement, ctx: EditorContext | null): void {
	closeDropdowns(plugin);

	const dropdown = document.createElement('div');
	dropdown.className = 'arcadia-dropdown-menu';

	const title = document.createElement('div');
	title.className = 'arcadia-dropdown-title';
	title.textContent = 'Slide Layouts';
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
	title.textContent = 'Slide Theme';
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
