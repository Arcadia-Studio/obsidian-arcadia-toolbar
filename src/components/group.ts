export function addGroup(container: HTMLElement, label: string, buttons: HTMLElement[]): HTMLElement {
	const group = document.createElement('div');
	group.className = 'arcadia-group';

	const buttonsRow = document.createElement('div');
	buttonsRow.className = 'arcadia-group-buttons';
	for (const btn of buttons) {
		buttonsRow.appendChild(btn);
	}
	group.appendChild(buttonsRow);

	const labelEl = document.createElement('div');
	labelEl.className = 'arcadia-group-label';
	labelEl.textContent = label;
	group.appendChild(labelEl);

	const sep = document.createElement('div');
	sep.className = 'arcadia-group-separator';
	container.appendChild(group);
	container.appendChild(sep);

	return group;
}
