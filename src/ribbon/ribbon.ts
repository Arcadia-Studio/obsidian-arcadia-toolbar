import { setIcon } from 'obsidian';
import type { ArcadiaPluginInterface, ArcadiaToolbarSettings, EditorContext } from '../types';
import { isReadingView, getActiveEditor, getActiveMarkdownView } from '../utils/dom';
import { closeDropdowns } from '../components/dropdown';
import { buildHomeTab } from './tab-home';
import { buildInsertTab } from './tab-insert';
import { buildReferencesTab } from './tab-references';
import { buildReviewTab } from './tab-review';
import { buildViewTab } from './tab-view';
import { buildNavigateTab } from './tab-navigate';
import { buildTemplatesTab } from './tab-templates';
import { buildCanvasTab } from './tab-canvas';
import { buildDataTab } from './tab-data';
import { buildSlidesTab } from './tab-slides';
import { buildTheologyTab } from './tab-theology';

export function removeToolbar(plugin: ArcadiaPluginInterface): void {
	if (plugin.toolbarEl) {
		plugin.toolbarEl.remove();
		plugin.toolbarEl = null;
	}
}

export function updateToolbar(plugin: ArcadiaPluginInterface): void {
	const view = getActiveMarkdownView(plugin);
	if (!view) return;
	removeToolbar(plugin);

	const isReading = isReadingView(view);
	const ctx: EditorContext | null = isReading ? null : getActiveEditor(plugin);

	// Create ribbon container
	plugin.toolbarEl = document.createElement('div');
	plugin.toolbarEl.className = 'arcadia-ribbon';

	// Tab bar
	const tabBar = document.createElement('div');
	tabBar.className = 'arcadia-ribbon-tabbar';

	const tabs: { id: string; label: string; icon: string; setting: keyof ArcadiaToolbarSettings }[] = [
		{ id: 'home', label: 'Home', icon: 'home', setting: 'showHomeTab' },
		{ id: 'insert', label: 'Insert', icon: 'plus-circle', setting: 'showInsertTab' },
		{ id: 'theology', label: 'Theology', icon: 'book-open', setting: 'showTheologyTab' },
		{ id: 'view', label: 'View', icon: 'eye', setting: 'showViewTab' },
		{ id: 'navigate', label: 'Navigate', icon: 'compass', setting: 'showNavigateTab' },
		{ id: 'templates', label: 'Templates', icon: 'file-input', setting: 'showTemplatesTab' },
		{ id: 'canvas', label: 'Canvas', icon: 'layout-grid', setting: 'showCanvasTab' },
		{ id: 'references', label: 'References', icon: 'book-marked', setting: 'showReferencesTab' },
		{ id: 'review', label: 'Review', icon: 'check-circle', setting: 'showReviewTab' },
		{ id: 'data', label: 'Data', icon: 'grid-3x3', setting: 'showDataTab' },
		{ id: 'slides', label: 'Slides', icon: 'presentation', setting: 'showSlidesTab' },
	];

	for (const tab of tabs) {
		if (!plugin.settings[tab.setting]) continue;

		const tabBtn = document.createElement('button');
		tabBtn.className = `arcadia-ribbon-tab${plugin.settings.activeTab === tab.id ? ' arcadia-ribbon-tab-active' : ''}`;
		tabBtn.dataset.tab = tab.id;

		const iconSpan = document.createElement('span');
		iconSpan.className = 'arcadia-ribbon-tab-icon';
		setIcon(iconSpan, tab.icon);
		tabBtn.appendChild(iconSpan);

		tabBtn.appendChild(document.createTextNode(tab.label));

		tabBtn.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			// BUG FIX: Only save when activeTab actually changes
			if (plugin.settings.activeTab !== tab.id) {
				plugin.settings.activeTab = tab.id;
				plugin.saveSettings();
			}
			plugin.updateToolbar();
		});

		tabBar.appendChild(tabBtn);
	}

	// Wrap tab bar with scroll arrows
	const tabWrapper = document.createElement('div');
	tabWrapper.className = 'arcadia-ribbon-tabbar-wrapper';

	const scrollLeft = document.createElement('button');
	scrollLeft.className = 'arcadia-tab-scroll-btn arcadia-tab-scroll-left';
	setIcon(scrollLeft, 'chevron-left');
	scrollLeft.addEventListener('click', () => tabBar.scrollBy({ left: -120, behavior: 'smooth' }));

	const scrollRight = document.createElement('button');
	scrollRight.className = 'arcadia-tab-scroll-btn arcadia-tab-scroll-right';
	setIcon(scrollRight, 'chevron-right');
	scrollRight.addEventListener('click', () => tabBar.scrollBy({ left: 120, behavior: 'smooth' }));

	tabWrapper.appendChild(scrollLeft);
	tabWrapper.appendChild(tabBar);
	tabWrapper.appendChild(scrollRight);
	plugin.toolbarEl.appendChild(tabWrapper);

	// Update scroll arrow visibility
	const updateScrollArrows = () => {
		const canScrollL = tabBar.scrollLeft > 0;
		const canScrollR = tabBar.scrollLeft + tabBar.clientWidth < tabBar.scrollWidth - 1;
		scrollLeft.classList.toggle('arcadia-tab-scroll-visible', canScrollL);
		scrollRight.classList.toggle('arcadia-tab-scroll-visible', canScrollR);
	};
	tabBar.addEventListener('scroll', updateScrollArrows);
	setTimeout(updateScrollArrows, 50);

	// Auto-scroll active tab into view
	const activeTabEl = tabBar.querySelector('.arcadia-ribbon-tab-active') as HTMLElement;
	if (activeTabEl) {
		setTimeout(() => activeTabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 60);
	}

	// Tab content
	const content = document.createElement('div');
	content.className = 'arcadia-ribbon-content';

	const editorTabs = ['home', 'insert', 'theology', 'canvas', 'references', 'templates', 'data'];
	const activeTab = plugin.settings.activeTab;

	if (ctx) {
		switch (activeTab) {
			case 'home': buildHomeTab(plugin, content, ctx); break;
			case 'insert': buildInsertTab(plugin, content, ctx); break;
			case 'theology': buildTheologyTab(plugin, content, ctx); break;
			case 'canvas': buildCanvasTab(plugin, content, ctx); break;
			case 'navigate': buildNavigateTab(plugin, content, ctx); break;
			case 'templates': buildTemplatesTab(plugin, content, ctx); break;
			case 'data': buildDataTab(plugin, content, ctx); break;
			case 'references': buildReferencesTab(plugin, content, ctx); break;
			case 'review': buildReviewTab(plugin, content, ctx); break;
			case 'view': buildViewTab(plugin, content, ctx); break;
			case 'slides': buildSlidesTab(plugin, content, ctx); break;
		}
	} else {
		if (editorTabs.includes(activeTab)) {
			const msg = document.createElement('div');
			msg.className = 'arcadia-reading-notice';
			msg.textContent = 'Switch to Editing View to use this tab';
			content.appendChild(msg);
		} else {
			switch (activeTab) {
				case 'navigate': buildNavigateTab(plugin, content, null); break;
				case 'review': buildReviewTab(plugin, content, null); break;
				case 'view': buildViewTab(plugin, content, null); break;
				case 'slides': buildSlidesTab(plugin, content, null); break;
			}
		}
	}

	plugin.toolbarEl.appendChild(content);

	// Always attach to view.contentEl
	view.contentEl.insertBefore(plugin.toolbarEl, view.contentEl.firstChild);
}
