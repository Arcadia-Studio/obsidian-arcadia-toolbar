import type { ArcadiaPluginInterface, EditorContext } from '../types';
import { createButton } from '../components/button';
import { addGroup } from '../components/group';
import { showDocStats } from '../utils/dom';

export function buildViewTab(plugin: ArcadiaPluginInterface, container: HTMLElement, ctx: EditorContext | null): void {
	// ---- TOC group ----
	const tocBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'list',
			tooltip: 'Toggle table of contents',
			action: () => { void plugin.toggleTOC(); },
		}),
		createButton(plugin, {
			icon: 'layout-sidebar-left',
			tooltip: 'Open TOC in sidebar',
			action: () => { void plugin.activateTOC(); },
		}),
	];
	addGroup(container, 'TOC', tocBtns);

	// ---- Mode group ----
	const modeBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'edit-3',
			tooltip: 'Editing view',
			action: () => plugin.executeCommand('markdown:toggle-preview'),
		}),
		createButton(plugin, {
			icon: 'book-open',
			tooltip: 'Reading view',
			action: () => plugin.executeCommand('markdown:toggle-preview'),
		}),
		createButton(plugin, {
			icon: 'columns',
			tooltip: 'Split view',
			action: () => plugin.executeCommand('workspace:split-vertical'),
		}),
	];
	addGroup(container, 'Mode', modeBtns);

	// ---- Zoom group ----
	const zoomBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'zoom-in',
			tooltip: 'Zoom in',
			action: () => plugin.executeCommand('window:zoom-in'),
		}),
		createButton(plugin, {
			icon: 'zoom-out',
			tooltip: 'Zoom out',
			action: () => plugin.executeCommand('window:zoom-out'),
		}),
		createButton(plugin, {
			icon: 'maximize',
			tooltip: 'Reset zoom',
			action: () => plugin.executeCommand('window:reset-zoom'),
		}),
	];
	addGroup(container, 'Zoom', zoomBtns);

	// ---- Plugins group ----
	const pluginBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'command',
			tooltip: 'Command palette',
			action: () => plugin.executeCommand('command-palette:open'),
		}),
		createButton(plugin, {
			icon: 'settings',
			tooltip: 'Open settings',
			action: () => plugin.executeCommand('app:open-settings'),
		}),
	];
	addGroup(container, 'Plugins', pluginBtns);

	// ---- Window group ----
	const windowBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'maximize-2',
			tooltip: 'Toggle fullscreen',
			action: () => plugin.executeCommand('window:toggle-fullscreen'),
		}),
		createButton(plugin, {
			icon: 'sidebar-close',
			tooltip: 'Toggle left sidebar',
			action: () => plugin.executeCommand('app:toggle-left-sidebar'),
		}),
		createButton(plugin, {
			icon: 'sidebar-open',
			tooltip: 'Toggle right sidebar',
			action: () => plugin.executeCommand('app:toggle-right-sidebar'),
		}),
	];
	addGroup(container, 'Window', windowBtns);

	// ---- Display group ----
	const displayBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'eye',
			tooltip: 'Focus mode',
			action: () => plugin.executeCommand('obsidian-focus-mode:toggle-focus-mode'),
			pluginId: 'obsidian-focus-mode',
		}),
		createButton(plugin, {
			icon: 'type',
			tooltip: 'Toggle reading width',
			action: () => plugin.executeCommand('editor:toggle-readable-line-length'),
		}),
	];
	addGroup(container, 'Display', displayBtns);

	// ---- Info group (with word count) ----
	const infoBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'info',
			tooltip: 'Document statistics',
			action: () => showDocStats(plugin),
		}),
	];

	// Build a word count display button
	const wordCountBtn = document.createElement('button');
	wordCountBtn.className = 'arcadia-btn arcadia-word-count';
	wordCountBtn.setAttribute('title', 'Word Count');
	wordCountBtn.addEventListener('click', (e) => {
		e.preventDefault();
		e.stopPropagation();
		showDocStats(plugin);
	});

	const activeCtx = plugin.getActiveEditor();
	if (activeCtx) {
		const text = activeCtx.editor.getValue();
		const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
		const countSpan = document.createElement('span');
		countSpan.className = 'arcadia-btn-label';
		countSpan.textContent = `${wordCount.toLocaleString()} words`;
		wordCountBtn.appendChild(countSpan);
	} else {
		const countSpan = document.createElement('span');
		countSpan.className = 'arcadia-btn-label';
		countSpan.textContent = '-- words';
		wordCountBtn.appendChild(countSpan);
	}

	infoBtns.push(wordCountBtn);
	addGroup(container, 'Info', infoBtns);
}
