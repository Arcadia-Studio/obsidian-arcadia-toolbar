export function addGroup(container: HTMLElement, label: string, buttons: HTMLElement[]): HTMLElement {
	const group = container.createDiv({ cls: 'arcadia-group' });

	const buttonsRow = group.createDiv({ cls: 'arcadia-group-buttons' });
	for (const btn of buttons) {
		buttonsRow.appendChild(btn);
	}

	group.createDiv({ cls: 'arcadia-group-label', text: label });

	container.createDiv({ cls: 'arcadia-group-separator' });

	return group;
}
