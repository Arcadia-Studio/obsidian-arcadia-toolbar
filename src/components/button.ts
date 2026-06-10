import { setIcon } from 'obsidian';
import type { ArcadiaPluginInterface } from '../types';
import { PremiumModal } from '../premium-modal';

export interface ButtonOptions {
	icon: string;
	tooltip: string;
	action: () => void;
	label?: string;
	pluginId?: string;
	requiresAI?: boolean;
	requiresPremium?: boolean;
	active?: boolean;
}

export function createButton(plugin: ArcadiaPluginInterface, options: ButtonOptions): HTMLButtonElement {
	const { icon, tooltip, action, label, pluginId, requiresAI, requiresPremium, active } = options;

	// Determine enabled state
	let enabled = true;
	let disabledReason = '';

	if (pluginId) {
		enabled = plugin.isPluginEnabled(pluginId);
		if (!enabled) disabledReason = ` (requires ${pluginId})`;
	}

	if (requiresAI) {
		enabled = plugin.isAIConfigured();
		if (!enabled) disabledReason = ' (requires AI API key, configure in settings)';
	}

	const locked = requiresPremium === true && !plugin.isPremium;

	const el = createEl('button', { cls: 'arcadia-btn' });

	if (!enabled && !locked) {
		el.classList.add('arcadia-btn-disabled');
	}
	if (locked) {
		el.classList.add('arcadia-btn-locked');
	}
	if (requiresAI && enabled && !locked) {
		el.classList.add('arcadia-ai-btn');
	}
	if (active) {
		el.classList.add('arcadia-btn-active');
	}

	el.setAttribute('aria-label', tooltip);
	if (locked) {
		el.setAttribute('title', `${tooltip} (premium feature)`);
	} else {
		el.setAttribute('title', enabled ? tooltip : `${tooltip}${disabledReason}`);
	}
	setIcon(el, icon);

	if (label) {
		el.createSpan({ cls: 'arcadia-btn-label', text: label });
	}

	if (locked) {
		el.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			plugin.closeDropdowns();
			new PremiumModal(plugin.app, plugin, tooltip).open();
		});
	} else if (enabled) {
		el.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			// stopPropagation skips the document-level dropdown closer, so close here
			plugin.closeDropdowns();
			action();
		});
	}

	return el;
}
