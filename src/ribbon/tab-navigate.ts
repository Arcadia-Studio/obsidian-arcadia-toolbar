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
			tooltip: 'Search in Vault',
			action: () => plugin.executeCommand('global-search:open'),
		}),
		createButton(plugin, {
			icon: 'file-search',
			tooltip: 'Find in Current File',
			action: () => plugin.executeCommand('editor:open-search'),
		}),
		createButton(plugin, {
			icon: 'replace',
			tooltip: 'Find and Replace',
			action: () => plugin.executeCommand('editor:open-search-replace'),
		}),
	];
	addGroup(container, 'Search', searchBtns);

	// ---- History group ----
	const historyBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'arrow-left',
			tooltip: 'Navigate Back',
			action: () => plugin.executeCommand('app:go-back'),
		}),
		createButton(plugin, {
			icon: 'arrow-right',
			tooltip: 'Navigate Forward',
			action: () => plugin.executeCommand('app:go-forward'),
		}),
	];
	addGroup(container, 'History', historyBtns);

	// ---- Links group ----
	const linksBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'link',
			tooltip: 'Open Link Under Cursor',
			action: () => plugin.executeCommand('editor:follow-link'),
		}),
		createButton(plugin, {
			icon: 'git-branch',
			tooltip: 'Open Backlinks',
			action: () => plugin.executeCommand('backlink:open-backlinks'),
		}),
		createButton(plugin, {
			icon: 'share-2',
			tooltip: 'Open Outgoing Links',
			action: () => plugin.executeCommand('outgoing-links:open-outgoing-links'),
		}),
	];
	addGroup(container, 'Links', linksBtns);

	// ---- Explore group ----
	const exploreBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'folder-open',
			tooltip: 'Open File Explorer',
			action: () => plugin.executeCommand('file-explorer:open'),
		}),
		createButton(plugin, {
			icon: 'git-fork',
			tooltip: 'Open Graph View',
			action: () => plugin.executeCommand('app:open-graph-view'),
		}),
		createButton(plugin, {
			icon: 'star',
			tooltip: 'Open Bookmarks',
			action: () => plugin.executeCommand('bookmarks:open'),
		}),
	];
	addGroup(container, 'Explore', exploreBtns);

	// ---- Recent Files dropdown ----
	const recentTrigger = createDropdownTrigger({
		icon: 'history',
		tooltip: 'Recent Files',
		label: 'Recent',
		openFn: (wrapper) => openRecentFilesDropdown(plugin, wrapper),
	});
	addGroup(container, 'Recent Files', [recentTrigger]);

	// ---- Workspace group ----
	const workspaceBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'layout-dashboard',
			tooltip: 'Manage Workspaces',
			action: () => plugin.executeCommand('workspaces:open'),
			pluginId: 'workspaces',
		}),
		createButton(plugin, {
			icon: 'save',
			tooltip: 'Save Workspace Layout',
			action: () => plugin.executeCommand('workspaces:save-and-load'),
			pluginId: 'workspaces',
		}),
	];
	addGroup(container, 'Workspace', workspaceBtns);

	// ---- Sidebar group ----
	const sidebarBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'panel-left',
			tooltip: 'Toggle Left Sidebar',
			action: () => plugin.executeCommand('app:toggle-left-sidebar'),
		}),
		createButton(plugin, {
			icon: 'panel-right',
			tooltip: 'Toggle Right Sidebar',
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
	title.textContent = 'Recent Files';
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
					plugin.app.workspace.getLeaf(false).openFile(file as import('obsidian').TFile);
				}
				closeDropdowns(plugin);
			});

			dropdown.appendChild(item);
		}
	}

	positionDropdown(plugin, dropdown, anchor);
}
