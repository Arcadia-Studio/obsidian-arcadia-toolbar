import { setIcon } from 'obsidian';
import type { ArcadiaPluginInterface } from '../types';

export interface DropdownTriggerOptions {
	icon: string;
	tooltip: string;
	label?: string;
	openFn: (wrapper: HTMLElement) => void;
}

export function createDropdownTrigger(options: DropdownTriggerOptions): HTMLElement {
	const wrapper = createDiv({ cls: 'arcadia-dropdown-wrapper' });

	const btnEl = wrapper.createEl('button', { cls: 'arcadia-btn' });
	btnEl.setAttribute('title', options.tooltip);

	const iconSpan = btnEl.createSpan();
	setIcon(iconSpan, options.icon);

	if (options.label) {
		btnEl.createSpan({ cls: 'arcadia-btn-label', text: options.label });
	}

	const arrow = btnEl.createSpan({ cls: 'arcadia-dropdown-arrow' });
	setIcon(arrow, 'chevron-down');

	btnEl.addEventListener('click', (e) => {
		e.preventDefault();
		e.stopPropagation();
		options.openFn(wrapper);
	});

	return wrapper;
}

export function positionDropdown(plugin: ArcadiaPluginInterface, dropdown: HTMLElement, anchor: HTMLElement): void {
	activeDocument.body.appendChild(dropdown);
	plugin.activeDropdown = dropdown;

	const rect = anchor.getBoundingClientRect();
	dropdown.style.top = `${rect.bottom + 4}px`;
	dropdown.style.left = `${rect.left}px`;

	window.requestAnimationFrame(() => {
		const dropRect = dropdown.getBoundingClientRect();
		if (dropRect.right > window.innerWidth - 8) {
			dropdown.style.left = `${window.innerWidth - dropRect.width - 8}px`;
		}
		if (dropRect.bottom > window.innerHeight - 8) {
			dropdown.style.top = `${rect.top - dropRect.height - 4}px`;
		}
	});
}

export function closeDropdowns(plugin: ArcadiaPluginInterface): void {
	if (plugin.activeDropdown) {
		plugin.activeDropdown.remove();
		plugin.activeDropdown = null;
	}
}
