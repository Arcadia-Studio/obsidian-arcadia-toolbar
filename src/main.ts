import { Debouncer, MarkdownView, Notice, Plugin, debounce } from 'obsidian';
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
import { validateLicense, isCacheValid, hasActiveLicense } from './license';

/** Shape of the persisted data.json, including the legacy showDrawTab field. */
type StoredToolbarData = Partial<ArcadiaToolbarSettings> & { showDrawTab?: boolean };

export default class ArcadiaToolbarPlugin extends Plugin implements ArcadiaPluginInterface {
	settings!: ArcadiaToolbarSettings;
	toolbarEl: HTMLElement | null = null;
	activeDropdown: HTMLElement | null = null;
	scripturePopupEl: HTMLElement | null = null;
	hoverTimeout: number | null = null;
	scriptureCache = new Map<string, string>();
	_filteredTableBackup: { start: number; end: number; original: string } | null = null;
	private debouncedToolbarUpdate: Debouncer<[], void> | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Register TOC view
		this.registerView(VIEW_TYPE_TOC, (leaf) => new ArcadiaTOCView(leaf, this));

		// Scripture hover system
		setupScriptureHover(
			this,
			(cb) => this.registerMarkdownPostProcessor(cb),
			(ext) => this.registerEditorExtension(ext as Parameters<typeof this.registerEditorExtension>[0]),
			(el, event, cb) => this.registerDomEvent(el, event as keyof DocumentEventMap, cb as (this: HTMLElement, ev: Event) => void)
		);

		// Close dropdowns on outside click
		this.registerDomEvent(activeDocument, 'click', (e: MouseEvent) => {
			if (this.activeDropdown) {
				const target = e.target as HTMLElement;
				if (!target.closest('.arcadia-dropdown-wrapper')) {
					this.closeDropdowns();
				}
			}
		});

		// Update toolbar on view changes (debounced: layout-change can fire in bursts)
		this.debouncedToolbarUpdate = debounce(() => this.updateToolbar(), 100, true);
		this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.debouncedToolbarUpdate?.()));
		this.registerEvent(this.app.workspace.on('layout-change', () => this.debouncedToolbarUpdate?.()));

		// Register all commands
		registerCommands(this);

		// Ribbon icon for TOC
		this.addRibbonIcon('list-tree', 'Toggle table of contents', () => { void this.toggleTOC(); });

		// Settings tab
		this.addSettingTab(new ArcadiaToolbarSettingTab(this.app, this));

		// Initial render
		this.app.workspace.onLayoutReady(() => {
			this.updateToolbar();
			if (this.settings.tocPinned && this.settings.tocShowOnStartup) {
				void this.activateTOC();
			}
			// Background license revalidation (fails soft when offline)
			void this.refreshLicense();
		});
	}

	onunload(): void {
		// Prevent a pending debounced update from re-creating the toolbar after unload
		this.debouncedToolbarUpdate?.cancel();
		removeToolbar(this);
		this.hideScripturePopup();
		// Close any open dropdowns on unload
		this.closeDropdowns();
	}

	async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as StoredToolbarData | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
		// Migrate showDrawTab -> showCanvasTab for backward compatibility
		if (data && 'showDrawTab' in data && !('showCanvasTab' in data)) {
			this.settings.showCanvasTab = Boolean(data.showDrawTab);
		}
		// Migrate activeTab 'draw' -> 'canvas'
		if (this.settings.activeTab === 'draw') {
			this.settings.activeTab = 'canvas';
		}
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	get isPremium(): boolean {
		return this.settings.isPro && hasActiveLicense(this.settings.licenseStatus);
	}

	/**
	 * Revalidate the stored license key in the background.
	 * - Confirms and refreshes the cached status when the server is reachable.
	 * - Keeps the cached status (grace period) when offline.
	 * - Only disables premium when the server explicitly rejects the key.
	 */
	async refreshLicense(): Promise<void> {
		const key = this.settings.licenseKey?.trim();
		if (!key) return;
		const cached = this.settings.licenseStatus;
		if (cached?.valid && isCacheValid(cached)) return;

		const result = await validateLicense(key);
		if (result.outcome === 'valid') {
			this.settings.licenseStatus = result.status;
			this.settings.isPro = true;
			await this.saveSettings();
		} else if (result.outcome === 'invalid') {
			const hadPremium = this.isPremium;
			this.settings.licenseStatus = { valid: false, lastChecked: Date.now() };
			this.settings.isPro = false;
			await this.saveSettings();
			if (hadPremium) {
				new Notice('Arcadia Toolbar: your license key is no longer valid. Premium features are disabled. Check your key in settings.');
			}
		}
		// 'offline': keep the cached status untouched; the grace period applies.
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
			void this.app.workspace.revealLeaf(leaf);
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
			activeWindow.clearTimeout(this.hoverTimeout);
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
