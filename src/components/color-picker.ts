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
	const wrapper = createDiv({ cls: 'arcadia-dropdown-wrapper' });

	const btnEl = wrapper.createEl('button', { cls: 'arcadia-btn arcadia-color-btn' });
	btnEl.setAttribute('title', tooltip);

	const iconSpan = btnEl.createSpan({ cls: 'arcadia-color-icon' });
	setIcon(iconSpan, iconName);

	const bar = btnEl.createSpan({ cls: 'arcadia-color-bar' });
	bar.style.setProperty('--arcadia-color-bar-bg', currentColor === 'transparent' ? '#ccc' : currentColor);

	const arrow = btnEl.createSpan({ cls: 'arcadia-dropdown-arrow' });
	setIcon(arrow, 'chevron-down');

	btnEl.addEventListener('click', (e) => {
		e.preventDefault();
		e.stopPropagation();
		openColorDropdown(plugin, wrapper, type, ctx);
	});

	group.querySelector('.arcadia-group-buttons')!.appendChild(wrapper);
}

function openColorDropdown(
	plugin: ArcadiaPluginInterface,
	wrapper: HTMLElement,
	type: 'font-color' | 'bg-color',
	ctx: EditorContext
): void {
	closeDropdowns(plugin);

	const dropdown = createDiv({ cls: 'arcadia-dropdown-menu' });

	dropdown.createDiv({
		cls: 'arcadia-dropdown-title',
		text: type === 'font-color' ? 'Font color' : 'Background color',
	});

	const colors = type === 'font-color' ? FONT_COLORS : BACKGROUND_COLORS;
	const grid = dropdown.createDiv({ cls: 'arcadia-color-grid' });

	for (const color of colors) {
		const swatch = grid.createEl('button', { cls: 'arcadia-color-swatch' });
		if (color === 'transparent') {
			swatch.textContent = '\u2715';
			swatch.addClass('arcadia-color-swatch-transparent');
		} else {
			swatch.style.setProperty('--arcadia-swatch-bg', color);
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
	}

	positionDropdown(plugin, dropdown, wrapper);
}
