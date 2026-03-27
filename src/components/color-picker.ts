import { Editor } from 'obsidian';
import type { ArcadiaPluginInterface, EditorContext } from '../types';
import { FONT_COLORS, BACKGROUND_COLORS } from '../types';
import { positionDropdown, closeDropdowns } from './dropdown';
import { applyFontColor, applyBackgroundColor } from '../features/editor-commands';
import { setIcon } from 'obsidian';

export function addColorButton(
	plugin: ArcadiaPluginInterface,
	group: HTMLElement,
	type: 'font-color' | 'bg-color',
	iconName: string,
	tooltip: string,
	currentColor: string,
	ctx: EditorContext
): void {
	const wrapper = document.createElement('div');
	wrapper.className = 'arcadia-dropdown-wrapper';

	const btnEl = document.createElement('button');
	btnEl.className = 'arcadia-btn arcadia-color-btn';
	btnEl.setAttribute('title', tooltip);

	const iconSpan = document.createElement('span');
	iconSpan.className = 'arcadia-color-icon';
	setIcon(iconSpan, iconName);
	btnEl.appendChild(iconSpan);

	const bar = document.createElement('span');
	bar.className = 'arcadia-color-bar';
	bar.style.backgroundColor = currentColor === 'transparent' ? '#ccc' : currentColor;
	btnEl.appendChild(bar);

	const arrow = document.createElement('span');
	arrow.className = 'arcadia-dropdown-arrow';
	setIcon(arrow, 'chevron-down');
	btnEl.appendChild(arrow);

	btnEl.addEventListener('click', (e) => {
		e.preventDefault();
		e.stopPropagation();
		openColorDropdown(plugin, wrapper, type, ctx);
	});

	wrapper.appendChild(btnEl);
	group.querySelector('.arcadia-group-buttons')!.appendChild(wrapper);
}

function openColorDropdown(
	plugin: ArcadiaPluginInterface,
	wrapper: HTMLElement,
	type: 'font-color' | 'bg-color',
	ctx: EditorContext
): void {
	closeDropdowns(plugin);

	const dropdown = document.createElement('div');
	dropdown.className = 'arcadia-dropdown-menu';

	const title = document.createElement('div');
	title.className = 'arcadia-dropdown-title';
	title.textContent = type === 'font-color' ? 'Font Color' : 'Background Color';
	dropdown.appendChild(title);

	const colors = type === 'font-color' ? FONT_COLORS : BACKGROUND_COLORS;
	const grid = document.createElement('div');
	grid.className = 'arcadia-color-grid';

	for (const color of colors) {
		const swatch = document.createElement('button');
		swatch.className = 'arcadia-color-swatch';
		if (color === 'transparent') {
			swatch.textContent = '\u2715';
			swatch.style.backgroundColor = '#fff';
			swatch.style.color = '#999';
		} else {
			swatch.style.backgroundColor = color;
		}
		swatch.setAttribute('title', color);
		swatch.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (type === 'font-color') {
				applyFontColor(plugin, ctx.editor, color);
			} else {
				applyBackgroundColor(plugin, ctx.editor, color);
			}
			closeDropdowns(plugin);
			plugin.updateToolbar();
		});
		grid.appendChild(swatch);
	}

	dropdown.appendChild(grid);
	positionDropdown(plugin, dropdown, wrapper);
}
