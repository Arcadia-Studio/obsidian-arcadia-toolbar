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
			tooltip: 'Insert template (Templater)',
			pluginId: 'templater-obsidian',
			action: () => plugin.executeCommand('templater-obsidian:insert-templater'),
		}),
		createButton(plugin, {
			icon: 'file-plus',
			tooltip: 'Create note from template (Templater)',
			pluginId: 'templater-obsidian',
			action: () => plugin.executeCommand('templater-obsidian:create-new-note-from-template'),
		}),
		createButton(plugin, {
			icon: 'copy',
			tooltip: 'Insert template (Core)',
			action: () => plugin.executeCommand('insert-template'),
		}),
	];
	addGroup(container, 'Quick insert', quickBtns);

	// ---- Daily Notes group ----
	const dailyBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'calendar',
			tooltip: 'Open today\'s Daily Note',
			action: () => plugin.executeCommand('daily-notes'),
		}),
		createButton(plugin, {
			icon: 'calendar-plus',
			tooltip: 'Open next daily note',
			action: () => plugin.executeCommand('daily-notes:goto-next'),
		}),
		createButton(plugin, {
			icon: 'calendar-minus',
			tooltip: 'Open previous daily note',
			action: () => plugin.executeCommand('daily-notes:goto-prev'),
		}),
	];
	addGroup(container, 'Daily notes', dailyBtns);

	// ---- Note Tools group ----
	const toolsBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'file-text',
			tooltip: 'New note',
			action: () => plugin.executeCommand('file-explorer:new-file'),
		}),
		createButton(plugin, {
			icon: 'folder-plus',
			tooltip: 'New folder',
			action: () => plugin.executeCommand('file-explorer:new-folder'),
		}),
		createButton(plugin, {
			icon: 'copy',
			tooltip: 'Duplicate note',
			action: () => plugin.executeCommand('file-explorer:duplicate-file'),
		}),
	];
	addGroup(container, 'Note tools', toolsBtns);

	// ---- Properties group ----
	const propsBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'tag',
			tooltip: 'Edit frontmatter / properties',
			action: () => plugin.executeCommand('editor:toggle-source'),
		}),
		createButton(plugin, {
			icon: 'hash',
			tooltip: 'Insert date',
			action: () => ctx && insertDate(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'clock',
			tooltip: 'Insert date and time',
			action: () => ctx && insertDateTime(ctx.editor),
		}),
	];
	addGroup(container, 'Properties', propsBtns);

	// ---- Snippets group ----
	const snippetBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'info',
			tooltip: 'Insert callout',
			action: () => ctx && insertCallout(ctx.editor),
		}),
		createButton(plugin, {
			icon: 'minus',
			tooltip: 'Insert horizontal rule',
			action: () => ctx && insertHorizontalRule(ctx.editor),
		}),
	];
	addGroup(container, 'Snippets', snippetBtns);
}
