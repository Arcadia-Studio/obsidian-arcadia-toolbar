import type { ArcadiaPluginInterface } from '../types';
import { SCRIPTURE_REF_REGEX, BOOK_LOOKUP } from '../types';
import { parseScriptureRef, fetchBibleText, fetchCommentary, fetchDictionary } from './bible-api';

export function showScripturePopup(plugin: ArcadiaPluginInterface, anchorEl: HTMLElement, refText: string): void {
	const ref = parseScriptureRef(refText);
	if (!ref) return;

	if (plugin.hoverTimeout) clearTimeout(plugin.hoverTimeout);

	plugin.hoverTimeout = setTimeout(async () => {
		plugin.hideScripturePopup();

		const popup = document.createElement('div');
		popup.className = 'arcadia-scripture-popup';

		// Header
		const header = document.createElement('div');
		header.className = 'arcadia-popup-header';

		const refSpan = document.createElement('span');
		refSpan.className = 'arcadia-popup-ref';
		refSpan.textContent = `${ref.canonical} ${ref.chapter}:${ref.verse}${ref.endVerse ? '\u2013' + ref.endVerse : ''}`;
		header.appendChild(refSpan);

		const modeLabel = document.createElement('span');
		modeLabel.className = 'arcadia-popup-mode';
		const mode = plugin.settings.hoverMode;
		modeLabel.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
		header.appendChild(modeLabel);

		popup.appendChild(header);

		// Loading state
		const content = document.createElement('div');
		content.className = 'arcadia-popup-content';
		const loadingEl = document.createElement('em');
		loadingEl.textContent = 'Loading...';
		content.appendChild(loadingEl);
		popup.appendChild(content);

		// Position popup near the anchor element
		document.body.appendChild(popup);
		plugin.scripturePopupEl = popup;

		const rect = anchorEl.getBoundingClientRect();
		popup.style.top = `${rect.bottom + 6}px`;
		popup.style.left = `${rect.left}px`;

		requestAnimationFrame(() => {
			const popRect = popup.getBoundingClientRect();
			if (popRect.right > window.innerWidth - 12) {
				popup.style.left = `${window.innerWidth - popRect.width - 12}px`;
			}
			if (popRect.bottom > window.innerHeight - 12) {
				popup.style.top = `${rect.top - popRect.height - 6}px`;
			}
		});

		// Hide on mouse leave from popup AND anchor (with grace period)
		const hideHandler = (e: MouseEvent) => {
			const target = e.relatedTarget as HTMLElement;
			if (target && (popup.contains(target) || target === anchorEl || anchorEl.contains(target))) return;
			setTimeout(() => {
				if (popup.matches(':hover') || anchorEl.matches(':hover')) return;
				plugin.hideScripturePopup();
				popup.removeEventListener('mouseleave', hideHandler);
				anchorEl.removeEventListener('mouseleave', hideHandler);
			}, 300);
		};
		popup.addEventListener('mouseenter', () => { if (plugin.hoverTimeout) clearTimeout(plugin.hoverTimeout); });
		popup.addEventListener('mouseleave', hideHandler);
		anchorEl.addEventListener('mouseleave', hideHandler);

		// Fetch content based on mode
		try {
			let result = '';
			switch (plugin.settings.hoverMode) {
				case 'bible':
					result = await fetchBibleText(plugin, ref);
					break;
				case 'commentary':
					result = await fetchCommentary(plugin, ref);
					break;
				case 'dictionary':
					result = await fetchDictionary(plugin, ref);
					break;
			}
			if (plugin.scripturePopupEl === popup) {
				// Parse trusted HTML from our own formatters using DOMParser for safety
				content.textContent = '';
				const parser = new DOMParser();
				const parsed = parser.parseFromString(result, 'text/html');
				const resultDiv = document.createElement('div');
				while (parsed.body.firstChild) {
					resultDiv.appendChild(parsed.body.firstChild);
				}
				content.appendChild(resultDiv);
			}
		} catch (err: unknown) {
			if (plugin.scripturePopupEl === popup) {
				content.textContent = '';
				const errEl = document.createElement('em');
				errEl.textContent = `Error: ${(err as Error).message}`;
				content.appendChild(errEl);
			}
		}
	}, 400);
}

export function setupScriptureHover(plugin: ArcadiaPluginInterface, registerMarkdownPostProcessor: (cb: (el: HTMLElement) => void) => void, registerEditorExtension: (ext: unknown) => void, registerDomEvent: (el: Document, event: string, cb: (e: MouseEvent) => void) => void): void {
	// === READING MODE: MarkdownPostProcessor ===
	registerMarkdownPostProcessor((el: HTMLElement) => {
		if (plugin.settings.hoverMode === 'off') return;

		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
		const textNodes: Text[] = [];
		while (walker.nextNode()) {
			textNodes.push(walker.currentNode as Text);
		}

		for (const node of textNodes) {
			const text = node.textContent;
			if (!text) continue;

			SCRIPTURE_REF_REGEX.lastIndex = 0;
			const matches: { index: number; length: number; text: string }[] = [];
			let m;
			while ((m = SCRIPTURE_REF_REGEX.exec(text)) !== null) {
				const bookText = m[1].replace(/\.$/, '').trim();
				if (BOOK_LOOKUP.has(bookText.toLowerCase())) {
					matches.push({ index: m.index, length: m[0].length, text: m[0] });
				}
			}

			if (matches.length === 0) continue;

			const frag = document.createDocumentFragment();
			let lastIdx = 0;
			for (const match of matches) {
				if (match.index > lastIdx) {
					frag.appendChild(document.createTextNode(text.substring(lastIdx, match.index)));
				}
				const span = document.createElement('span');
				span.className = 'arcadia-scripture-ref';
				span.dataset.ref = match.text;
				span.textContent = match.text;

				span.addEventListener('mouseenter', () => {
					showScripturePopup(plugin, span, match.text);
				});
				span.addEventListener('mouseleave', (e) => {
					const related = e.relatedTarget as HTMLElement;
					if (related && related.closest('.arcadia-scripture-popup')) return;
					setTimeout(() => {
						if (plugin.scripturePopupEl && !plugin.scripturePopupEl.matches(':hover')) {
							plugin.hideScripturePopup();
						}
					}, 300);
				});

				frag.appendChild(span);
				lastIdx = match.index + match.length;
			}
			if (lastIdx < text.length) {
				frag.appendChild(document.createTextNode(text.substring(lastIdx)));
			}

			node.parentNode!.replaceChild(frag, node);
		}
	});

	// === LIVE PREVIEW: CM6 ViewPlugin ===
	// Minimal local interfaces for CM6 shapes (avoids explicit any while keeping runtime require)
	interface ScriptureEditorView {
		viewport: { from: number; to: number };
		state: { doc: { sliceString(from: number, to: number): string } };
	}
	interface ScriptureViewUpdate {
		docChanged: boolean;
		viewportChanged: boolean;
		view: ScriptureEditorView;
	}
	interface ScriptureViewPlugin {
		decorations: unknown;
	}

	// CM6 modules loaded at runtime via dynamic import (peer dependencies bundled by Obsidian)
	void Promise.all([
		import('@codemirror/view') as Promise<Record<string, unknown>>,
		import('@codemirror/state') as Promise<Record<string, unknown>>,
	]).then(([cmView, cmState]) => {
		const ViewPlugin = cmView.ViewPlugin as { fromClass: (cls: unknown, spec: unknown) => unknown };
		const Decoration = cmView.Decoration as { none: unknown; mark: (spec: Record<string, unknown>) => unknown };
		const RangeSetBuilder = cmState.RangeSetBuilder as new () => { add(from: number, to: number, value: unknown): void; finish(): unknown };

		const scriptureHoverPlugin = ViewPlugin.fromClass(
			class {
				decorations: unknown;

				constructor(view: ScriptureEditorView) {
					this.decorations = this.buildDecorations(view);
				}

				update(update: ScriptureViewUpdate) {
					if (update.docChanged || update.viewportChanged) {
						this.decorations = this.buildDecorations(update.view);
					}
				}

				buildDecorations(view: ScriptureEditorView) {
					if (plugin.settings.hoverMode === 'off') {
						return Decoration.none;
					}

					const builder = new RangeSetBuilder();
					const { from, to } = view.viewport;
					const text = view.state.doc.sliceString(from, to);

					SCRIPTURE_REF_REGEX.lastIndex = 0;
					let m;
					while ((m = SCRIPTURE_REF_REGEX.exec(text)) !== null) {
						const bookText = m[1].replace(/\.$/, '').trim();
						if (BOOK_LOOKUP.has(bookText.toLowerCase())) {
							builder.add(
								from + m.index,
								from + m.index + m[0].length,
								Decoration.mark({
									class: 'arcadia-scripture-ref',
									attributes: { 'data-ref': m[0] },
								})
							);
						}
					}
					return builder.finish();
				}
			},
			{ decorations: (v: ScriptureViewPlugin) => v.decorations }
		);

		registerEditorExtension(scriptureHoverPlugin);

		// Add hover listener for CM6 decorated spans
		registerDomEvent(document, 'mouseover', (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (target.closest('.arcadia-scripture-popup')) return;
			if (target.classList?.contains('arcadia-scripture-ref') || target.closest('.arcadia-scripture-ref')) {
				const refEl = target.classList.contains('arcadia-scripture-ref')
					? target
					: target.closest('.arcadia-scripture-ref') as HTMLElement;
				if (refEl && refEl.dataset.ref) {
					showScripturePopup(plugin, refEl, refEl.dataset.ref);
				}
			}
		});
	}).catch(() => {
		// CM6 scripture hover extension not available, using reading mode only
	});
}
