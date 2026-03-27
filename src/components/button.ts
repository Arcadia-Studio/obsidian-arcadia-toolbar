import { setIcon } from 'obsidian';
import type { ArcadiaPluginInterface } from '../types';

export interface ButtonOptions {
	icon: string;
	tooltip: string;
	action: () => void;
	label?: string;
	pluginId?: string;
	requiresAI?: boolean;
	active?: boolean;
}

export function createButton(plugin: ArcadiaPluginInterface, options: ButtonOptions): HTMLButtonElement {
	const { icon, tooltip, action, label, pluginId, requiresAI, active } = options;

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

	const el = document.createElement('button');
	el.className = 'arcadia-btn';

	if (!enabled) {
		el.classList.add('arcadia-btn-disabled');
	}
	if (requiresAI && enabled) {
		el.classList.add('arcadia-ai-btn');
	}
	if (active) {
		el.classList.add('arcadia-btn-active');
	}

	el.setAttribute('aria-label', tooltip);
	el.setAttribute('title', enabled ? tooltip : `${tooltip}${disabledReason}`);
	setIcon(el, icon);

	if (label) {
		const labelEl = document.createElement('span');
		labelEl.className = 'arcadia-btn-label';
		labelEl.textContent = label;
		el.appendChild(labelEl);
	}

	if (enabled) {
		el.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			action();
		});
	}

	return el;
}
