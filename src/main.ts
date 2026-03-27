import { Editor, MarkdownView, Plugin, Notice } from 'obsidian';
import type { ArcadiaToolbarSettings, ArcadiaPluginInterface, EditorContext } from './types';
import { VIEW_TYPE_TOC, DEFAULT_SETTINGS } from './types';
import { ArcadiaTOCView } from './sidebar/toc-view';
import { ArcadiaToolbarSettingTab } from './settings';
import { updateToolbar, removeToolbar } from './ribbon/ribbon';
import { closeDropdowns, positionDropdown } from './components/dropdown';
import { setupScriptureHover, showScripturePopup } from './features/scripture-hover';
import { callAI } from './features/ai-integration';
import { registerCommands } from './utils/commands';
import { isPluginEnabled, executeCommand, openInNewLeaf, getActiveEditor, getActiveMarkdownView } from './utils/dom';

export default class ArcadiaToolbarPlugin extends Plugin implements ArcadiaPluginInterface {
	settings!: ArcadiaToolbarSettings;
	toolbarEl: HTMLElement | null = null;
	activeDropdown: HTMLElement | null = null;
	scripturePopupEl: HTMLElement | null = null;
	hoverTimeout: ReturnType<typeof setTimeout> | null = null;
	scriptureCache = new Map<string, string>();
	_filteredTableBackup: { start: number; end: number; original: string } | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Register TOC view
		this.registerView(VIEW_TYPE_TOC, (leaf) => new ArcadiaTOCView(leaf, this));

		// Scripture hover system
		setupScriptureHover(
			this,
			(cb) => this.registerMarkdownPostProcessor(cb),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(ext) => this.registerEditorExtension(ext as any),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(el, event, cb) => this.registerDomEvent(el, event as any, cb as any)
		);

		// Close dropdowns on outside click
		this.registerDomEvent(document, 'click', (e: MouseEvent) => {
			if (this.activeDropdown) {
				const target = e.target as HTMLElement;
				if (!target.closest('.arcadia-dropdown-wrapper')) {
					this.closeDropdowns();
				}
			}
		});

		// Update toolbar on view changes
		this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.updateToolbar()));
		this.registerEvent(this.app.workspace.on('layout-change', () => this.updateToolbar()));

		// Register all commands
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		registerCommands(this as any);

		// Ribbon icon for TOC
		this.addRibbonIcon('list-tree', 'Toggle Table of Contents', () => this.toggleTOC());

		// Settings tab
		this.addSettingTab(new ArcadiaToolbarSettingTab(this.app, this));

		// Initial render
		this.app.workspace.onLayoutReady(() => {
			this.updateToolbar();
			if (this.settings.tocPinned && this.settings.tocShowOnStartup) {
				this.activateTOC();
			}
		});
	}

	onunload(): void {
		removeToolbar(this);
		this.hideScripturePopup();
		// BUG FIX: Close any open dropdowns on unload
		this.closeDropdowns();
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_TOC);
	}

	async loadSettings(): Promise<void> {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
		// Migrate showDrawTab -> showCanvasTab for backward compatibility
		if (data && 'showDrawTab' in data && !('showCanvasTab' in data)) {
			this.settings.showCanvasTab = (data as Record<string, unknown>).showDrawTab as boolean;
		}
		// Migrate activeTab 'draw' -> 'canvas'
		if (this.settings.activeTab === 'draw') {
			this.settings.activeTab = 'canvas';
		}
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	// ========================================================================
	// TOC MANAGEMENT
	// ========================================================================

	async activateTOC(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_TOC);
		if (existing.length > 0) return;

		// Open TOC in the right sidebar (where outline/backlinks live), not the left (file explorer)
		const leaf = this.app.workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({ type: VIEW_TYPE_TOC, active: true });
			this.app.workspace.revealLeaf(leaf);
		}
	}

	async toggleTOC(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_TOC);
		if (existing.length > 0) {
			existing.forEach(leaf => leaf.detach());
		} else {
			await this.activateTOC();
		}
	}

	// ========================================================================
	// DELEGATED METHODS (implementing ArcadiaPluginInterface)
	// ========================================================================

	updateToolbar(): void {
		updateToolbar(this);
	}

	closeDropdowns(): void {
		closeDropdowns(this);
	}

	positionDropdown(dropdown: HTMLElement, anchor: HTMLElement): void {
		positionDropdown(this, dropdown, anchor);
	}

	isPluginEnabled(pluginId: string): boolean {
		return isPluginEnabled(this, pluginId);
	}

	executeCommand(commandId: string): void {
		executeCommand(this, commandId);
	}

	openInNewLeaf(commandId: string): void {
		openInNewLeaf(this, commandId);
	}

	isAIConfigured(): boolean {
		return this.settings.aiProvider !== 'none' && this.settings.aiApiKey.length > 0;
	}

	async callAI(prompt: string): Promise<string> {
		return callAI(this, prompt);
	}

	getActiveEditor(): EditorContext | null {
		return getActiveEditor(this);
	}

	getActiveMarkdownView(): MarkdownView | null {
		return getActiveMarkdownView(this);
	}

	hideScripturePopup(): void {
		if (this.hoverTimeout) {
			clearTimeout(this.hoverTimeout);
			this.hoverTimeout = null;
		}
		if (this.scripturePopupEl) {
			this.scripturePopupEl.remove();
			this.scripturePopupEl = null;
		}
	}

	showScripturePopup(anchorEl: HTMLElement, refText: string): void {
		showScripturePopup(this, anchorEl, refText);
	}
}
