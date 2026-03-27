import type { ArcadiaPluginInterface, EditorContext } from '../types';
import { createButton } from '../components/button';
import { addGroup } from '../components/group';
import {
	insertDate,
	insertDateTime,
	insertCallout,
	insertHorizontalRule,
} from '../features/editor-commands';

export function buildTemplatesTab(plugin: ArcadiaPluginInterface, container: HTMLElement, ctx: EditorContext | null): void {
	// ---- Quick Insert group ----
	const quickBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'layout-template',
			tooltip: 'Insert Template (Templater)',
			pluginId: 'templater-obsidian',
			action: () => plugin.executeCommand('templater-obsidian:insert-templater'),
		}),
		createButton(plugin, {
			icon: 'file-plus',
			tooltip: 'Create Note from Template (Templater)',
			pluginId: 'templater-obsidian',
			action: () => plugin.executeCommand('templater-obsidian:create-new-note-from-template'),
		}),
		createButton(plugin, {
			icon: 'copy',
			tooltip: 'Insert Template (Core)',
			action: () => plugin.executeCommand('insert-template'),
		}),
	];
	addGroup(container, 'Quick Insert', quickBtns);

	// ---- Daily Notes group ----
	const dailyBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'calendar',
			tooltip: 'Open Today\'s Daily Note',
			action: () => plugin.executeCommand('daily-notes'),
		}),
		createButton(plugin, {
			icon: 'calendar-plus',
			tooltip: 'Open Next Daily Note',
			action: () => plugin.executeCommand('daily-notes:goto-next'),
		}),
		createButton(plugin, {
			icon: 'calendar-minus',
			tooltip: 'Open Previous Daily Note',
			action: () => plugin.executeCommand('daily-notes:goto-prev'),
		}),
	];
	addGroup(container, 'Daily Notes', dailyBtns);

	// ---- Note Tools group ----
	const toolsBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'file-text',
			tooltip: 'New Note',
			action: () => plugin.executeCommand('file-explorer:new-file'),
		}),
		createButton(plugin, {
			icon: 'folder-plus',
			tooltip: 'New Folder',
			action: () => plugin.executeCommand('file-explorer:new-folder'),
		}),
		createButton(plugin, {
			icon: 'copy',
			tooltip: 'Duplicate Note',
			action: () => plugin.executeCommand('file-explorer:duplicate-file'),
		}),
	];
	addGroup(container, 'Note Tools', toolsBtns);

	// ---- Properties group ----
	const propsBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'tag',
			tooltip: 'Edit Frontmatter / Properties',
			action: () => plugin.executeCommand('editor:toggle-source'),
		}),
		createButton(plugin, {
			icon: 'hash',
			tooltip: 'Insert Date',
			action: () => ctx && insertDate(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'clock',
			tooltip: 'Insert Date and Time',
			action: () => ctx && insertDateTime(ctx.editor),
		}),
	];
	addGroup(container, 'Properties', propsBtns);

	// ---- Snippets group ----
	const snippetBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'info',
			tooltip: 'Insert Callout',
			action: () => ctx && insertCallout(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'minus',
			tooltip: 'Insert Horizontal Rule',
			action: () => ctx && insertHorizontalRule(ctx.editor),
		}),
	];
	addGroup(container, 'Snippets', snippetBtns);
}
