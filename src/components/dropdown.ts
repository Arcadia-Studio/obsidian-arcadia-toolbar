import { setIcon } from 'obsidian';
import type { ArcadiaPluginInterface } from '../types';

export interface DropdownTriggerOptions {
	icon: string;
	tooltip: string;
	label?: string;
	openFn: (wrapper: HTMLElement) => void;
}

export function createDropdownTrigger(options: DropdownTriggerOptions): HTMLElement {
	const wrapper = document.createElement('div');
	wrapper.className = 'arcadia-dropdown-wrapper';

	const btnEl = document.createElement('button');
	btnEl.className = 'arcadia-btn';
	btnEl.setAttribute('title', options.tooltip);

	const iconSpan = document.createElement('span');
	setIcon(iconSpan, options.icon);
	btnEl.appendChild(iconSpan);

	if (options.label) {
		const labelEl = document.createElement('span');
		labelEl.className = 'arcadia-btn-label';
		labelEl.textContent = options.label;
		btnEl.appendChild(labelEl);
	}

	const arrow = document.createElement('span');
	arrow.className = 'arcadia-dropdown-arrow';
	setIcon(arrow, 'chevron-down');
	btnEl.appendChild(arrow);

	btnEl.addEventListener('click', (e) => {
		e.preventDefault();
		e.stopPropagation();
		options.openFn(wrapper);
	});

	wrapper.appendChild(btnEl);
	return wrapper;
}

export function positionDropdown(plugin: ArcadiaPluginInterface, dropdown: HTMLElement, anchor: HTMLElement): void {
	document.body.appendChild(dropdown);
	plugin.activeDropdown = dropdown;

	const rect = anchor.getBoundingClientRect();
	dropdown.style.top = `${rect.bottom + 4}px`;
	dropdown.style.left = `${rect.left}px`;

	requestAnimationFrame(() => {
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
