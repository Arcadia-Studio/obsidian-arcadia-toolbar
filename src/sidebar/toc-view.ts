import { ItemView, WorkspaceLeaf, MarkdownView, setIcon, debounce } from 'obsidian';
import type { ArcadiaPluginInterface } from '../types';
import { VIEW_TYPE_TOC } from '../types';

export class ArcadiaTOCView extends ItemView {
	plugin: ArcadiaPluginInterface;
	private debouncedRender: () => void;

	constructor(leaf: WorkspaceLeaf, plugin: ArcadiaPluginInterface) {
		super(leaf);
		this.plugin = plugin;
		this.debouncedRender = debounce(() => this.renderTOC(), 300, true);
	}

	getViewType(): string { return VIEW_TYPE_TOC; }
	getDisplayText(): string { return 'Table of contents'; }
	getIcon(): string { return 'list-tree'; }

	async onOpen(): Promise<void> {
		await super.onOpen();
		this.containerEl.addClass('arcadia-toc-container');
		this.renderTOC();

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => this.debouncedRender())
		);
		this.registerEvent(
			this.app.metadataCache.on('changed', () => this.debouncedRender())
		);
		this.registerEvent(
			this.app.workspace.on('editor-change', () => this.debouncedRender())
		);
	}

	renderTOC(): void {
		const content = this.containerEl.children[1];
		if (!content) return;
		content.empty();

		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView || !activeView.file) {
			const empty = content.createDiv({ cls: 'arcadia-toc-empty' });
			const iconContainer = empty.createDiv({ cls: 'arcadia-toc-empty-icon' });
			setIcon(iconContainer, 'file-text');
			empty.createDiv({ text: 'Open a document to see its outline', cls: 'arcadia-toc-empty-text' });
			return;
		}

		// Header
		const header = content.createDiv({ cls: 'arcadia-toc-header' });
		const titleRow = header.createDiv({ cls: 'arcadia-toc-title-row' });
		const iconEl = titleRow.createSpan({ cls: 'arcadia-toc-header-icon' });
		setIcon(iconEl, 'list-tree');
		titleRow.createSpan({ text: 'Contents', cls: 'arcadia-toc-title' });

		header.createDiv({
			text: activeView.file.basename,
			cls: 'arcadia-toc-filename'
		});

		const cache = this.app.metadataCache.getFileCache(activeView.file);
		if (!cache?.headings || cache.headings.length === 0) {
			const empty = content.createDiv({ cls: 'arcadia-toc-empty' });
			empty.createDiv({ text: 'No headings in this document', cls: 'arcadia-toc-empty-text' });
			return;
		}

		const editor = activeView.editor;
		const cursorLine = editor.getCursor().line;

		const list = content.createDiv({ cls: 'arcadia-toc-list' });

		for (let i = 0; i < cache.headings.length; i++) {
			const heading = cache.headings[i];
			const nextLine = i + 1 < cache.headings.length
				? cache.headings[i + 1].position.start.line
				: Infinity;

			const isActive = cursorLine >= heading.position.start.line && cursorLine < nextLine;

			const item = list.createDiv({
				cls: `arcadia-toc-item arcadia-toc-level-${heading.level}${isActive ? ' arcadia-toc-active' : ''}`,
			});

			const bullet = item.createSpan({ cls: 'arcadia-toc-bullet' });
			bullet.textContent = heading.level <= 2 ? '\u25CF' : '\u25CB';

			item.createSpan({ text: heading.heading, cls: 'arcadia-toc-text' });

			item.addEventListener('click', () => {
				const line = heading.position.start.line;
				editor.setCursor(line, 0);
				editor.scrollIntoView(
					{ from: { line, ch: 0 }, to: { line, ch: 0 } },
					true
				);
				this.renderTOC();
			});
		}
	}

	async onClose(): Promise<void> {
		await Promise.resolve();
	}
}
