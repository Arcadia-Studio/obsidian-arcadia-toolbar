import { MarkdownView, Notice, TFile } from 'obsidian';
import type { ArcadiaPluginInterface, EditorContext } from '../types';

/**
 * Private API wrappers. All (this.app as any) casts are isolated here.
 * Each cast is documented with why it is necessary.
 */

/** Check if a community plugin is enabled. Uses private API: app.plugins.enabledPlugins */
export function isPluginEnabled(plugin: ArcadiaPluginInterface, pluginId: string): boolean {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (plugin.app as any).plugins?.enabledPlugins?.has(pluginId) ?? false;
}

/** Execute an Obsidian command by ID. Uses private API: app.commands.executeCommandById */
export function executeCommand(plugin: ArcadiaPluginInterface, commandId: string): void {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(plugin.app as any).commands.executeCommandById(commandId);
}

/** Open a command result in a new split leaf */
export function openInNewLeaf(plugin: ArcadiaPluginInterface, commandId: string): void {
	const leaf = plugin.app.workspace.getLeaf('split');
	plugin.app.workspace.setActiveLeaf(leaf);
	executeCommand(plugin, commandId);
}

/** Get active editor context (editor + view), or null if not in editing mode */
export function getActiveEditor(plugin: ArcadiaPluginInterface): EditorContext | null {
	const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
	if (!view) return null;
	return { editor: view.editor, view };
}

/** Get active markdown view (reading or editing) */
export function getActiveMarkdownView(plugin: ArcadiaPluginInterface): MarkdownView | null {
	return plugin.app.workspace.getActiveViewOfType(MarkdownView);
}

/** Check if reading view is active. Uses private API: view.getMode() */
export function isReadingView(view: MarkdownView): boolean {
	return (view as unknown as { getMode?: () => string }).getMode?.() === 'preview';
}

/** Get recent files. Uses private API: workspace.getLastOpenFiles */
export function getRecentFiles(plugin: ArcadiaPluginInterface): string[] {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (plugin.app as any).workspace.getLastOpenFiles?.() || [];
}

/** Get unresolved links. Uses private API: metadataCache.unresolvedLinks */
export function getUnresolvedLinks(plugin: ArcadiaPluginInterface): Record<string, Record<string, number>> | null {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (plugin.app.metadataCache as any).unresolvedLinks || null;
}

// ============================================================================
// REVIEW TAB HELPERS
// ============================================================================

export function showWordCountGoal(plugin: ArcadiaPluginInterface, editor: { getValue(): string }): void {
	const text = editor.getValue();
	const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
	const targets = [250, 500, 750, 1000, 1500, 2000, 3000, 5000, 10000];
	const nextTarget = targets.find(t => t > words) || targets[targets.length - 1];
	const progress = Math.min(100, Math.round((words / nextTarget) * 100));
	const bar = '\u2588'.repeat(Math.round(progress / 5)) + '\u2591'.repeat(20 - Math.round(progress / 5));
	new Notice(
		`Writing Goal Progress\n` +
		`Words: ${words.toLocaleString()} / ${nextTarget.toLocaleString()}\n` +
		`[${bar}] ${progress}%\n` +
		`Remaining: ${Math.max(0, nextTarget - words).toLocaleString()} words`,
		10000
	);
}

export function readAloud(plugin: ArcadiaPluginInterface): void {
	const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
	if (!view) { new Notice('No active note'); return; }
	const text = view.editor.getSelection() || view.editor.getValue();
	if (!text.trim()) { new Notice('No text to read'); return; }
	if (!window.speechSynthesis) { new Notice('Browser does not support text-to-speech'); return; }
	window.speechSynthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.rate = 1.0;
	utterance.pitch = 1.0;
	window.speechSynthesis.speak(utterance);
	new Notice('Reading aloud...');
}

export function stopSpeaking(): void {
	if (window.speechSynthesis) {
		window.speechSynthesis.cancel();
		new Notice('Stopped speaking');
	}
}

export function showDocStats(plugin: ArcadiaPluginInterface): void {
	const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
	if (!view) { new Notice('No active note'); return; }
	const text = view.editor.getValue();
	const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
	const chars = text.length;
	const charsNoSpaces = text.replace(/\s/g, '').length;
	const lines = text.split('\n').length;
	const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
	const readingTime = Math.ceil(words / 225);
	new Notice(
		`Document Statistics\n` +
		`Words: ${words.toLocaleString()}\n` +
		`Characters: ${chars.toLocaleString()} (${charsNoSpaces.toLocaleString()} without spaces)\n` +
		`Lines: ${lines.toLocaleString()}\n` +
		`Paragraphs: ${paragraphs.toLocaleString()}\n` +
		`Reading time: ~${readingTime} min`,
		10000
	);
}

/** Create unresolved pages in a "New Pages" folder */
export async function createUnresolvedPages(plugin: ArcadiaPluginInterface): Promise<void> {
	const unresolvedLinks = getUnresolvedLinks(plugin);
	if (!unresolvedLinks) {
		new Notice('No unresolved links data available');
		return;
	}

	const unresolvedSet = new Set<string>();
	for (const sourcePath of Object.keys(unresolvedLinks)) {
		for (const linkName of Object.keys(unresolvedLinks[sourcePath])) {
			const existing = plugin.app.metadataCache.getFirstLinkpathDest(linkName, '');
			if (!existing) {
				unresolvedSet.add(linkName);
			}
		}
	}

	if (unresolvedSet.size === 0) {
		new Notice('All linked pages already exist!');
		return;
	}

	const folderPath = 'New Pages';
	const folder = plugin.app.vault.getAbstractFileByPath(folderPath);
	if (!folder) {
		await plugin.app.vault.createFolder(folderPath);
	}

	let created = 0;
	for (const name of unresolvedSet) {
		const filePath = `${folderPath}/${name}.md`;
		const exists = plugin.app.vault.getAbstractFileByPath(filePath);
		if (!exists) {
			await plugin.app.vault.create(filePath, `# ${name}\n\n`);
			created++;
		}
	}

	new Notice(`Created ${created} new page${created !== 1 ? 's' : ''} in "${folderPath}/" folder`);
}
