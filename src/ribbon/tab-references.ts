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
import { setIcon } from 'obsidian';

export function buildReferencesTab(plugin: ArcadiaPluginInterface, container: HTMLElement, ctx: EditorContext | null): void {
	// ---- Citations dropdown ----
	const citationTrigger = createDropdownTrigger({
		icon: 'book-marked',
		tooltip: 'Insert Citation (Footnote)',
		label: 'Citation',
		openFn: (wrapper) => openCitationDropdown(plugin, wrapper, ctx, 'footnote'),
	});
	addGroup(container, 'Citations', [citationTrigger]);

	// ---- Inline Citations dropdown ----
	const inlineTrigger = createDropdownTrigger({
		icon: 'parentheses',
		tooltip: 'Insert Inline Citation',
		label: 'Inline',
		openFn: (wrapper) => openCitationDropdown(plugin, wrapper, ctx, 'inline'),
	});
	addGroup(container, 'Inline Citations', [inlineTrigger]);

	// ---- Bibliography group ----
	const bibBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'library',
			tooltip: 'Generate Bibliography from Footnotes',
			action: () => ctx && generateBibliography(ctx.editor),
		}),
	];
	addGroup(container, 'Bibliography', bibBtns);

	// ---- AI Tools group ----
	const convertTrigger = createDropdownTrigger({
		icon: 'repeat',
		tooltip: 'Convert Citations (AI)',
		openFn: (wrapper) => openAIConvertDropdown(plugin, wrapper, ctx),
	});

	const linkCitationsBtn = createButton(plugin, {
		icon: 'external-link',
		tooltip: 'Link Citations to Google Books (AI)',
		requiresAI: true,
		action: () => ctx && aiLinkCitations(plugin, ctx.editor),
	});

	addGroup(container, 'AI Tools', [convertTrigger, linkCitationsBtn]);
}

function openCitationDropdown(
	plugin: ArcadiaPluginInterface,
	anchor: HTMLElement,
	ctx: EditorContext | null,
	mode: 'footnote' | 'inline'
): void {
	closeDropdowns(plugin);

	const dropdown = document.createElement('div');
	dropdown.className = 'arcadia-dropdown-menu';

	const title = document.createElement('div');
	title.className = 'arcadia-dropdown-title';
	title.textContent = mode === 'footnote' ? 'Footnote Citation Style' : 'Inline Citation Style';
	dropdown.appendChild(title);

	for (const [key, style] of Object.entries(CITATION_STYLES)) {
		if (mode === 'footnote' && style.type !== 'footnote') continue;
		if (mode === 'inline' && style.type !== 'inline') continue;

		const item = document.createElement('button');
		item.className = 'arcadia-dropdown-item';

		const iconSpan = document.createElement('span');
		setIcon(iconSpan, 'book-open');
		item.appendChild(iconSpan);

		const nameSpan = document.createElement('span');
		nameSpan.textContent = style.name;
		item.appendChild(nameSpan);

		const templateSpan = document.createElement('span');
		templateSpan.className = 'arcadia-dropdown-item-hint';
		templateSpan.textContent = style.template;
		item.appendChild(templateSpan);

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

		dropdown.appendChild(item);
	}

	positionDropdown(plugin, dropdown, anchor);
}

function openAIConvertDropdown(
	plugin: ArcadiaPluginInterface,
	anchor: HTMLElement,
	ctx: EditorContext | null
): void {
	closeDropdowns(plugin);

	const dropdown = document.createElement('div');
	dropdown.className = 'arcadia-dropdown-menu';

	const title = document.createElement('div');
	title.className = 'arcadia-dropdown-title';
	title.textContent = 'Convert Citations To...';
	dropdown.appendChild(title);

	for (const [key, style] of Object.entries(CITATION_STYLES)) {
		const item = document.createElement('button');
		item.className = 'arcadia-dropdown-item';

		if (!plugin.isAIConfigured()) {
			item.classList.add('arcadia-btn-disabled');
		}

		const iconSpan = document.createElement('span');
		setIcon(iconSpan, 'sparkles');
		item.appendChild(iconSpan);

		const nameSpan = document.createElement('span');
		nameSpan.textContent = style.name;
		item.appendChild(nameSpan);

		item.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (ctx && plugin.isAIConfigured()) {
				aiConvertCitationsInDocument(plugin, ctx.editor, key);
			}
			closeDropdowns(plugin);
		});

		dropdown.appendChild(item);
	}

	positionDropdown(plugin, dropdown, anchor);
}
