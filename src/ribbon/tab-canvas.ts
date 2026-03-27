import type { ArcadiaPluginInterface, EditorContext } from '../types';
import { createButton } from '../components/button';
import { addGroup } from '../components/group';
import { createDropdownTrigger, positionDropdown, closeDropdowns } from '../components/dropdown';
import { setIcon } from 'obsidian';

// Canvas template definitions
const CANVAS_TEMPLATES: { name: string; icon: string; desc: string; content: string }[] = [
	{
		name: 'Blank Canvas',
		icon: 'square',
		desc: 'Empty canvas',
		content: '{"nodes":[],"edges":[]}',
	},
	{
		name: 'Mind Map',
		icon: 'git-branch',
		desc: 'Central node with branches',
		content: JSON.stringify({
			nodes: [
				{ id: '1', type: 'text', text: '# Central Topic', x: 0, y: 0, width: 200, height: 60 },
				{ id: '2', type: 'text', text: 'Branch 1', x: 280, y: -80, width: 150, height: 50 },
				{ id: '3', type: 'text', text: 'Branch 2', x: 280, y: 20, width: 150, height: 50 },
				{ id: '4', type: 'text', text: 'Branch 3', x: 280, y: 120, width: 150, height: 50 },
			],
			edges: [
				{ id: 'e1', fromNode: '1', toNode: '2' },
				{ id: 'e2', fromNode: '1', toNode: '3' },
				{ id: 'e3', fromNode: '1', toNode: '4' },
			],
		}),
	},
	{
		name: 'Flowchart',
		icon: 'workflow',
		desc: 'Linear process flow',
		content: JSON.stringify({
			nodes: [
				{ id: '1', type: 'text', text: 'Start', x: 0, y: 0, width: 120, height: 50 },
				{ id: '2', type: 'text', text: 'Step 1', x: 0, y: 120, width: 120, height: 50 },
				{ id: '3', type: 'text', text: 'Step 2', x: 0, y: 240, width: 120, height: 50 },
				{ id: '4', type: 'text', text: 'End', x: 0, y: 360, width: 120, height: 50 },
			],
			edges: [
				{ id: 'e1', fromNode: '1', toNode: '2' },
				{ id: 'e2', fromNode: '2', toNode: '3' },
				{ id: 'e3', fromNode: '3', toNode: '4' },
			],
		}),
	},
	{
		name: 'Comparison',
		icon: 'git-compare',
		desc: 'Two-column comparison',
		content: JSON.stringify({
			nodes: [
				{ id: '1', type: 'text', text: '## Option A', x: -220, y: 0, width: 180, height: 200 },
				{ id: '2', type: 'text', text: '## Option B', x: 40, y: 0, width: 180, height: 200 },
			],
			edges: [],
		}),
	},
];

export function buildCanvasTab(plugin: ArcadiaPluginInterface, container: HTMLElement, ctx: EditorContext | null): void {
	// ---- Canvas group ----
	const canvasBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'layout-grid',
			tooltip: 'New Canvas',
			action: () => plugin.executeCommand('canvas:new-file'),
		}),
		createButton(plugin, {
			icon: 'folder-open',
			tooltip: 'Open Canvas File',
			action: () => plugin.executeCommand('file-explorer:open'),
		}),
	];
	addGroup(container, 'Canvas', canvasBtns);

	// ---- Drawing group (Excalidraw only, Read Aloud removed per bug fix) ----
	const drawingBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'pen-tool',
			tooltip: 'New Excalidraw Drawing',
			pluginId: 'obsidian-excalidraw-plugin',
			action: () => plugin.executeCommand('obsidian-excalidraw-plugin:excalidraw-autocreate'),
		}),
		createButton(plugin, {
			icon: 'image',
			tooltip: 'Insert Excalidraw',
			pluginId: 'obsidian-excalidraw-plugin',
			action: () => plugin.executeCommand('obsidian-excalidraw-plugin:excalidraw-autocreate-and-embed'),
		}),
	];
	addGroup(container, 'Drawing', drawingBtns);

	// ---- Templates dropdown ----
	const templateTrigger = createDropdownTrigger({
		icon: 'layout-template',
		tooltip: 'Canvas Templates',
		label: 'Templates',
		openFn: (wrapper) => openCanvasTemplatesDropdown(plugin, wrapper),
	});
	addGroup(container, 'Templates', [templateTrigger]);

	// ---- Presentation group ----
	const presentBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'presentation',
			tooltip: 'Start Canvas Presentation',
			pluginId: 'obsidian-advanced-slides',
			action: () => plugin.executeCommand('obsidian-advanced-slides:start-server'),
		}),
	];
	addGroup(container, 'Presentation', presentBtns);

	// ---- Diagrams group ----
	const diagramBtns: HTMLElement[] = [
		createButton(plugin, {
			icon: 'share-2',
			tooltip: 'Insert Mermaid Diagram',
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) {
					const cursor = activeCtx.editor.getCursor();
					activeCtx.editor.replaceRange(
						'```mermaid\ngraph TD\n    A --> B\n```\n',
						cursor
					);
					activeCtx.editor.setCursor({ line: cursor.line + 1, ch: 0 });
				}
			},
		}),
		createButton(plugin, {
			icon: 'boxes',
			tooltip: 'Insert PlantUML Diagram',
			action: () => {
				const activeCtx = plugin.getActiveEditor();
				if (activeCtx) {
					const cursor = activeCtx.editor.getCursor();
					activeCtx.editor.replaceRange(
						'```plantuml\n@startuml\nAlice -> Bob: Hello\n@enduml\n```\n',
						cursor
					);
					activeCtx.editor.setCursor({ line: cursor.line + 2, ch: 0 });
				}
			},
		}),
	];
	addGroup(container, 'Diagrams', diagramBtns);
}

function openCanvasTemplatesDropdown(plugin: ArcadiaPluginInterface, anchor: HTMLElement): void {
	closeDropdowns(plugin);

	const dropdown = document.createElement('div');
	dropdown.className = 'arcadia-dropdown-menu';

	const title = document.createElement('div');
	title.className = 'arcadia-dropdown-title';
	title.textContent = 'Canvas Templates';
	dropdown.appendChild(title);

	for (const tmpl of CANVAS_TEMPLATES) {
		const item = document.createElement('button');
		item.className = 'arcadia-dropdown-item';

		const iconSpan = document.createElement('span');
		setIcon(iconSpan, tmpl.icon);
		item.appendChild(iconSpan);

		const nameSpan = document.createElement('span');
		nameSpan.textContent = tmpl.name;
		item.appendChild(nameSpan);

		const descSpan = document.createElement('span');
		descSpan.className = 'arcadia-dropdown-item-hint';
		descSpan.textContent = tmpl.desc;
		item.appendChild(descSpan);

		item.addEventListener('click', async (e) => {
			e.preventDefault();
			e.stopPropagation();
			closeDropdowns(plugin);

			try {
				const fileName = `${tmpl.name.replace(/\s+/g, '-')}-${Date.now()}.canvas`;
				const file = await plugin.app.vault.create(fileName, tmpl.content);
				await plugin.app.workspace.getLeaf(false).openFile(file);
			} catch (err) {
				const { Notice } = await import('obsidian');
				new Notice('Could not create canvas: ' + (err as Error).message);
			}
		});

		dropdown.appendChild(item);
	}

	positionDropdown(plugin, dropdown, anchor);
}
