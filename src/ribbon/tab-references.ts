import type { ArcadiaPluginInterface, EditorContext } from '../types';
import { CITATION_STYLES } from '../types';
import { createButton } from '../components/button';
import { addGroup } from '../components/group';
import { createDropdownTrigger, positionDropdown, closeDropdowns } from '../components/dropdown';
import {
	insertCitationFootnote,
	insertInlineCitation,
	generateBibliography,
} from '../features/editor-commands';
import {
	aiConvertCitationsInDocument,
	aiLinkCitations,
} from '../features/ai-integration';
import { PremiumModal } from '../premium-modal';
import { setIcon } from 'obsidian';

export function buildReferencesTab(plugin: ArcadiaPluginInterface, container: HTMLElement, ctx: EditorContext | null): void {
	// ---- Citations dropdown ----
	const citationTrigger = createDropdownTrigger({
		icon: 'book-marked',
		tooltip: 'Insert citation (Footnote)',
		label: 'Citation',
		openFn: (wrapper) => openCitationDropdown(plugin, wrapper, ctx, 'footnote'),
	});
	addGroup(container, 'Citations', [citationTrigger]);

	// ---- Inline Citations dropdown ----
	const inlineTrigger = createDropdownTrigger({
		icon: 'parentheses',
		tooltip: 'Insert inline citation',
		label: 'Inline',
		openFn: (wrapper) => openCitationDropdown(plugin, wrapper, ctx, 'inline'),
	});
	addGroup(container, 'Inline citations', [inlineTrigger]);

	// ---- Bibliography group ----
	const bibBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'library',
			tooltip: 'Generate bibliography from footnotes',
			action: () => ctx && generateBibliography(ctx.editor),
		}),
	];
	addGroup(container, 'Bibliography', bibBtns);

	// ---- AI Tools group (premium) ----
	const convertTrigger = createDropdownTrigger({
		icon: 'repeat',
		tooltip: 'Convert citations (AI)',
		openFn: (wrapper) => {
			if (!plugin.isPremium) {
				new PremiumModal(plugin.app, plugin, 'Convert citations (AI)').open();
				return;
			}
			openAIConvertDropdown(plugin, wrapper, ctx);
		},
	});

	const linkCitationsBtn = createButton(plugin, {
		icon: 'external-link',
		tooltip: 'Link citations to Google Books (AI)',
		requiresAI: true,
		requiresPremium: true,
		action: () => { if (ctx) void aiLinkCitations(plugin, ctx.editor); },
	});

	addGroup(container, 'AI tools', [convertTrigger, linkCitationsBtn]);
}

function openCitationDropdown(
	plugin: ArcadiaPluginInterface,
	anchor: HTMLElement,
	ctx: EditorContext | null,
	mode: 'footnote' | 'inline'
): void {
	closeDropdowns(plugin);

	const dropdown = createDiv({ cls: 'arcadia-dropdown-menu' });

	dropdown.createDiv({
		cls: 'arcadia-dropdown-title',
		text: mode === 'footnote' ? 'Footnote citation style' : 'Inline citation style',
	});

	for (const [key, style] of Object.entries(CITATION_STYLES)) {
		if (mode === 'footnote' && style.type !== 'footnote') continue;
		if (mode === 'inline' && style.type !== 'inline') continue;

		const item = dropdown.createEl('button', { cls: 'arcadia-dropdown-item' });

		const iconSpan = item.createSpan();
		setIcon(iconSpan, 'book-open');

		item.createSpan({ text: style.name });

		item.createSpan({ cls: 'arcadia-dropdown-item-hint', text: style.template });

		item.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (ctx) {
				if (mode === 'footnote') {
					insertCitationFootnote(ctx.editor, key);
				} else {
					insertInlineCitation(ctx.editor, key);
				}
			}
			closeDropdowns(plugin);
		});
	}

	positionDropdown(plugin, dropdown, anchor);
}

function openAIConvertDropdown(
	plugin: ArcadiaPluginInterface,
	anchor: HTMLElement,
	ctx: EditorContext | null
): void {
	closeDropdowns(plugin);

	const dropdown = createDiv({ cls: 'arcadia-dropdown-menu' });

	dropdown.createDiv({ cls: 'arcadia-dropdown-title', text: 'Convert citations to...' });

	for (const [key, style] of Object.entries(CITATION_STYLES)) {
		const item = dropdown.createEl('button', { cls: 'arcadia-dropdown-item' });

		if (!plugin.isAIConfigured()) {
			item.classList.add('arcadia-btn-disabled');
		}

		const iconSpan = item.createSpan();
		setIcon(iconSpan, 'sparkles');

		item.createSpan({ text: style.name });

		item.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (ctx && plugin.isAIConfigured()) {
				void aiConvertCitationsInDocument(plugin, ctx.editor, key);
			}
			closeDropdowns(plugin);
		});
	}

	positionDropdown(plugin, dropdown, anchor);
}
