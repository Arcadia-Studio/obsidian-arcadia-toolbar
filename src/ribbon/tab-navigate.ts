import type { ArcadiaPluginInterface, EditorContext } from '../types';
import { createButton } from '../components/button';
import { addGroup } from '../components/group';
import { createDropdownTrigger, positionDropdown, closeDropdowns } from '../components/dropdown';
import { getRecentFiles } from '../utils/dom';
import { setIcon } from 'obsidian';

export function buildNavigateTab(plugin: ArcadiaPluginInterface, container: HTMLElement, ctx: EditorContext | null): void {
	// ---- Search group ----
	const searchBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'search',
			tooltip: 'Search in vault',
			action: () => plugin.executeCommand('global-search:open'),
		}),
		createButton(plugin, {
			icon: 'file-search',
			tooltip: 'Find in current file',
			action: () => plugin.executeCommand('editor:open-search'),
		}),
		createButton(plugin, {
			icon: 'replace',
			tooltip: 'Find and replace',
			action: () => plugin.executeCommand('editor:open-search-replace'),
		}),
	];
	addGroup(container, 'Search', searchBtns);

	// ---- History group ----
	const historyBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'arrow-left',
			tooltip: 'Navigate back',
			action: () => plugin.executeCommand('app:go-back'),
		}),
		createButton(plugin, {
			icon: 'arrow-right',
			tooltip: 'Navigate forward',
			action: () => plugin.executeCommand('app:go-forward'),
		}),
	];
	addGroup(container, 'History', historyBtns);

	// ---- Links group ----
	const linksBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'link',
			tooltip: 'Open link under cursor',
			action: () => plugin.executeCommand('editor:follow-link'),
		}),
		createButton(plugin, {
			icon: 'git-branch',
			tooltip: 'Open backlinks',
			action: () => plugin.executeCommand('backlink:open-backlinks'),
		}),
		createButton(plugin, {
			icon: 'share-2',
			tooltip: 'Open outgoing links',
			action: () => plugin.executeCommand('outgoing-links:open-outgoing-links'),
		}),
	];
	addGroup(container, 'Links', linksBtns);

	// ---- Explore group ----
	const exploreBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'folder-open',
			tooltip: 'Open file explorer',
			action: () => plugin.executeCommand('file-explorer:open'),
		}),
		createButton(plugin, {
			icon: 'git-fork',
			tooltip: 'Open graph view',
			action: () => plugin.executeCommand('app:open-graph-view'),
		}),
		createButton(plugin, {
			icon: 'star',
			tooltip: 'Open bookmarks',
			action: () => plugin.executeCommand('bookmarks:open'),
		}),
	];
	addGroup(container, 'Explore', exploreBtns);

	// ---- Recent Files dropdown ----
	const recentTrigger = createDropdownTrigger({
		icon: 'history',
		tooltip: 'Recent files',
		label: 'Recent',
		openFn: (wrapper) => openRecentFilesDropdown(plugin, wrapper),
	});
	addGroup(container, 'Recent files', [recentTrigger]);

	// ---- Workspace group ----
	const workspaceBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'layout-dashboard',
			tooltip: 'Manage workspaces',
			action: () => plugin.executeCommand('workspaces:open'),
			pluginId: 'workspaces',
		}),
		createButton(plugin, {
			icon: 'save',
			tooltip: 'Save workspace layout',
			action: () => plugin.executeCommand('workspaces:save-and-load'),
			pluginId: 'workspaces',
		}),
	];
	addGroup(container, 'Workspace', workspaceBtns);

	// ---- Sidebar group ----
	const sidebarBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'panel-left',
			tooltip: 'Toggle left sidebar',
			action: () => plugin.executeCommand('app:toggle-left-sidebar'),
		}),
		createButton(plugin, {
			icon: 'panel-right',
			tooltip: 'Toggle right sidebar',
			action: () => plugin.executeCommand('app:toggle-right-sidebar'),
		}),
	];
	addGroup(container, 'Sidebar', sidebarBtns);
}

function openRecentFilesDropdown(plugin: ArcadiaPluginInterface, anchor: HTMLElement): void {
	closeDropdowns(plugin);

	const dropdown = document.createElement('div');
	dropdown.className = 'arcadia-dropdown-menu arcadia-recent-files-dropdown';

	const title = document.createElement('div');
	title.className = 'arcadia-dropdown-title';
	title.textContent = 'Recent files';
	dropdown.appendChild(title);

	const recentFiles = getRecentFiles(plugin);
	const filesToShow = recentFiles.slice(0, 15);

	if (filesToShow.length === 0) {
		const emptyEl = document.createElement('div');
		emptyEl.className = 'arcadia-dropdown-empty';
		emptyEl.textContent = 'No recent files';
		dropdown.appendChild(emptyEl);
	} else {
		for (const filePath of filesToShow) {
			const item = document.createElement('button');
			item.className = 'arcadia-dropdown-item';

			const iconSpan = document.createElement('span');
			setIcon(iconSpan, 'file-text');
			item.appendChild(iconSpan);

			const nameSpan = document.createElement('span');
			// Show just the file name, not the full path
			const parts = filePath.split('/');
			const fileName = parts[parts.length - 1].replace(/\.md$/, '');
			nameSpan.textContent = fileName;
			nameSpan.setAttribute('title', filePath);
			item.appendChild(nameSpan);

			item.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				const file = plugin.app.vault.getAbstractFileByPath(filePath);
				if (file) {
					void plugin.app.workspace.getLeaf(false).openFile(file as import('obsidian').TFile);
				}
				closeDropdowns(plugin);
			});

			dropdown.appendChild(item);
		}
	}

	positionDropdown(plugin, dropdown, anchor);
}
