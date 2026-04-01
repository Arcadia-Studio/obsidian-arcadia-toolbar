import type { ArcadiaPluginInterface, EditorContext } from '../types';
import { createButton } from '../components/button';
import { addGroup } from '../components/group';
import {
	showWordCountGoal,
	readAloud,
	stopSpeaking,
	showDocStats,
	createUnresolvedPages,
} from '../utils/dom';

export function buildReviewTab(plugin: ArcadiaPluginInterface, container: HTMLElement, ctx: EditorContext | null): void {
	// ---- Proofing group ----
	const proofingBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'spell-check',
			tooltip: 'Spell check (system)',
			action: () => plugin.executeCommand('editor:toggle-spellcheck'),
		}),
		createButton(plugin, {
			icon: 'search',
			tooltip: 'Find / replace',
			action: () => plugin.executeCommand('editor:open-search-replace'),
		}),
	];
	addGroup(container, 'Proofing', proofingBtns);

	// ---- Links group ----
	const linksBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'link-2',
			tooltip: 'Check unresolved links',
			action: () => plugin.executeCommand('app:open-graph-view'),
		}),
		createButton(plugin, {
			icon: 'file-plus',
			tooltip: 'Create unresolved pages',
			action: () => { void createUnresolvedPages(plugin); },
		}),
	];
	addGroup(container, 'Links', linksBtns);

	// ---- Writing Goals group ----
	const goalBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'target',
			tooltip: 'Show writing goal progress',
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) {
					showWordCountGoal(plugin, activeCtx.editor);
				}
			},
		}),
		createButton(plugin, {
			icon: 'bar-chart',
			tooltip: 'Document statistics',
			action: () => showDocStats(plugin),
		}),
	];
	addGroup(container, 'Writing goals', goalBtns);

	// ---- Speech group ----
	const speechBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'volume-2',
			tooltip: 'Read aloud',
			action: () => readAloud(plugin),
		}),
		createButton(plugin, {
			icon: 'volume-x',
			tooltip: 'Stop speaking',
			action: () => stopSpeaking(),
		}),
	];
	addGroup(container, 'Speech', speechBtns);

	// ---- Notes group ----
	const notesBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'message-circle',
			tooltip: 'Insert comment',
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) {
					const sel = activeCtx.editor.getSelection();
					if (sel) {
						activeCtx.editor.replaceSelection(`%%${sel}%%`);
					} else {
						const cursor = activeCtx.editor.getCursor();
						activeCtx.editor.replaceRange('%%comment%%', cursor);
						activeCtx.editor.setCursor({ line: cursor.line, ch: cursor.ch + 2 });
					}
				}
			},
		}),
	];
	addGroup(container, 'Notes', notesBtns);
}
