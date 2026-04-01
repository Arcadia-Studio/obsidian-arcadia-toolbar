import { App, PluginSettingTab, Setting } from 'obsidian';
import type { ArcadiaPluginInterface } from './types';
import { BIBLE_TRANSLATIONS, COMMENTARIES, BIBLE_DICTIONARIES, AI_PROVIDERS } from './types';
import { validateLicense } from './license';

export class ArcadiaToolbarSettingTab extends PluginSettingTab {
	plugin: ArcadiaPluginInterface;

	constructor(app: App, plugin: ArcadiaPluginInterface & { addSettingTab?: unknown }) {
		super(app, plugin as unknown as import('obsidian').Plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Tab Visibility
		new Setting(containerEl).setName('Ribbon tabs').setHeading();


		const tabToggles: { key: string; name: string; desc: string }[] = [
			{ key: 'showHomeTab', name: 'Show home tab', desc: 'Text formatting, colors, headings, lists, alignment' },
			{ key: 'showInsertTab', name: 'Show insert tab', desc: 'Links, images, tables, code, callouts, footnotes' },
			{ key: 'showTheologyTab', name: 'Show theology tab', desc: 'Scripture blocks, cross-references, original language notes' },
			{ key: 'showViewTab', name: 'Show view tab', desc: 'Table of contents, word count, display options' },
			{ key: 'showNavigateTab', name: 'Show navigate tab', desc: 'Search, history, links, file explorer, workspace management' },
			{ key: 'showTemplatesTab', name: 'Show templates tab', desc: 'Quick insert templates, daily notes, note tools, properties' },
			{ key: 'showCanvasTab', name: 'Show canvas tab', desc: 'Canvas, Excalidraw, presentations, Mermaid and PlantUML' },
			{ key: 'showReferencesTab', name: 'Show references tab', desc: 'Citations (Turabian, Chicago, APA, MLA), bibliography, footnotes' },
			{ key: 'showReviewTab', name: 'Show review tab', desc: 'Spell check, search, backlinks, speech, comments, statistics' },
			{ key: 'showDataTab', name: 'Show data tab', desc: 'Tables, rows/columns, sort, CSV, formulas, charts, AI tools' },
			{ key: 'showSlidesTab', name: 'Show slides tab', desc: 'Presentation mode, slide separators, themes (Advanced Slides)' },
		];

		for (const tab of tabToggles) {
			new Setting(containerEl)
				.setName(tab.name)
				.setDesc(tab.desc)
				.addToggle(t => t.setValue((this.plugin.settings as unknown as Record<string, boolean>)[tab.key])
					.onChange(async v => {
						(this.plugin.settings as unknown as Record<string, boolean>)[tab.key] = v;
						await this.plugin.saveSettings();
						this.plugin.updateToolbar();
					}));
		}

		// TOC Settings
		new Setting(containerEl).setName('Table of contents').setHeading();


		new Setting(containerEl)
			.setName('Pin table of contents on startup')
			.setDesc('Automatically open the table of contents panel when Obsidian starts')
			.addToggle(t => t.setValue(this.plugin.settings.tocShowOnStartup)
				.onChange(async v => {
					this.plugin.settings.tocShowOnStartup = v;
					this.plugin.settings.tocPinned = v;
					await this.plugin.saveSettings();
				}));

		// Scripture Settings
		new Setting(containerEl).setName('Scripture').setHeading();

		new Setting(containerEl)
			.setName('Default translation')
			.setDesc('Default bible translation for scripture blocks')
			.addDropdown(d => {
				for (const [code, name] of Object.entries(BIBLE_TRANSLATIONS)) {
					d.addOption(code, `${code} \u2014 ${name}`);
				}
				d.setValue(this.plugin.settings.scriptureTranslation)
					.onChange(async v => {
						this.plugin.settings.scriptureTranslation = v;
						await this.plugin.saveSettings();
						this.plugin.updateToolbar();
					});
			});

		// Scripture Hover Settings
		new Setting(containerEl).setName('Scripture hover lookup').setHeading();

		containerEl.createEl('p', {
			text: 'Hover over any scripture reference (e.g., John 3:16) to see a floating popup with bible text, commentary, or dictionary content. Toggle modes from the theology tab.',
			cls: 'setting-item-description',
		});

		new Setting(containerEl)
			.setName('Hover bible translation')
			.setDesc('Translation used for bible hover popups (bible-api.com supports KJV, ASV, BBE, WEB, YLT)')
			.addDropdown(d => {
				const hoverTranslations: Record<string, string> = {
					'kjv': 'KJV \u2014 King James Version',
					'asv': 'ASV \u2014 American Standard Version',
					'bbe': 'BBE \u2014 Bible in Basic English',
					'darby': 'DARBY \u2014 Darby Translation',
					'web': 'WEB \u2014 World English Bible',
					'ylt': "YLT \u2014 Young's Literal Translation",
				};
				for (const [code, name] of Object.entries(hoverTranslations)) {
					d.addOption(code, name);
				}
				d.setValue(this.plugin.settings.hoverBibleTranslation)
					.onChange(async v => {
						this.plugin.settings.hoverBibleTranslation = v;
						this.plugin.scriptureCache.clear();
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Default commentary')
			.setDesc('Commentary source for hover popups (public domain)')
			.addDropdown(d => {
				for (const [key, c] of Object.entries(COMMENTARIES)) {
					d.addOption(key, c.name);
				}
				d.setValue(this.plugin.settings.defaultCommentary)
					.onChange(async v => {
						this.plugin.settings.defaultCommentary = v;
						this.plugin.scriptureCache.clear();
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Default dictionary')
			.setDesc('Bible dictionary source for hover popups')
			.addDropdown(d => {
				for (const [key, dict] of Object.entries(BIBLE_DICTIONARIES)) {
					d.addOption(key, dict.name);
				}
				d.setValue(this.plugin.settings.defaultDictionary)
					.onChange(async v => {
						this.plugin.settings.defaultDictionary = v;
						this.plugin.scriptureCache.clear();
						await this.plugin.saveSettings();
					});
			});

		// AI Integration Settings
		new Setting(containerEl).setName('AI integration').setHeading();

		containerEl.createEl('p', {
			text: 'Connect an AI provider to enable citation conversion, google books linking, and notes-to-slides features. AI-powered buttons appear grayed out until configured.',
			cls: 'setting-item-description',
		});

		let modelDropdown: HTMLSelectElement | null = null;

		const updateModelOptions = () => {
			if (!modelDropdown) return;
			// Clear existing options safely
			while (modelDropdown.firstChild) {
				modelDropdown.removeChild(modelDropdown.firstChild);
			}
			const provider = AI_PROVIDERS[this.plugin.settings.aiProvider];
			if (provider) {
				for (const m of provider.models) {
					const opt = document.createElement('option');
					opt.value = m;
					opt.textContent = m;
					modelDropdown.appendChild(opt);
				}
				if (provider.models.includes(this.plugin.settings.aiModel)) {
					modelDropdown.value = this.plugin.settings.aiModel;
				} else {
					modelDropdown.value = provider.models[0];
					this.plugin.settings.aiModel = provider.models[0];
				}
			} else {
				const opt = document.createElement('option');
				opt.value = '';
				opt.textContent = 'Select a provider first';
				modelDropdown.appendChild(opt);
			}
		};

		new Setting(containerEl)
			.setName('AI provider')
			.setDesc('Choose your AI service provider')
			.addDropdown(d => {
				d.addOption('none', '\u2014 none \u2014');
				for (const [key, provider] of Object.entries(AI_PROVIDERS)) {
					d.addOption(key, provider.name);
				}
				d.setValue(this.plugin.settings.aiProvider)
					.onChange(async v => {
						this.plugin.settings.aiProvider = v;
						const p = AI_PROVIDERS[v];
						if (p) {
							this.plugin.settings.aiModel = p.models[0];
						}
						await this.plugin.saveSettings();
						updateModelOptions();
						this.plugin.updateToolbar();
					});
			});

		new Setting(containerEl)
			.setName('API key')
			.setDesc("Your API key (stored locally in this vault's data.json)")
			.addText(t => {
				t.inputEl.type = 'password';
				t.inputEl.addClass('arcadia-api-key-input');
				t.setPlaceholder('sk-...')
					.setValue(this.plugin.settings.aiApiKey)
					.onChange(async v => {
						this.plugin.settings.aiApiKey = v;
						await this.plugin.saveSettings();
						this.plugin.updateToolbar();
					});
			});

		new Setting(containerEl)
			.setName('Model')
			.setDesc('Choose which model to use')
			.addDropdown(d => {
				modelDropdown = d.selectEl;
				updateModelOptions();
				d.onChange(async v => {
					this.plugin.settings.aiModel = v;
					await this.plugin.saveSettings();
				});
			});

		// License Section
		new Setting(containerEl).setName('License').setHeading();

		const licenseStatus = this.plugin.settings.licenseStatus;
		const isPro = this.plugin.settings.isPro && licenseStatus?.valid;
		const statusDesc = isPro
			? `Active${licenseStatus?.customerEmail ? ` (${licenseStatus.customerEmail})` : ''}${licenseStatus?.expiresAt ? ` - expires ${licenseStatus.expiresAt}` : ''}`
			: 'No active license. Enter your license key and click Validate.';

		const licenseStatusEl = containerEl.createEl('p', {
			text: `License status: ${statusDesc}`,
			cls: isPro ? 'mod-success' : 'mod-warning',
		});

		new Setting(containerEl)
			.setName('License key')
			.setDesc('Enter your Arcadia Toolbar premium license key from Lemon Squeezy.')
			.addText(t => {
				t.setPlaceholder('xxxx-xxxx-xxxx-xxxx')
					.setValue(this.plugin.settings.licenseKey)
					.onChange(async v => {
						this.plugin.settings.licenseKey = v.trim();
						await this.plugin.saveSettings();
					});
			})
			.addButton(btn => btn
				.setButtonText('Validate')
				.setCta()
				.onClick(async () => {
					const key = this.plugin.settings.licenseKey.trim();
					if (!key) return;
					btn.setButtonText('Checking...').setDisabled(true);
					const status = await validateLicense(key);
					this.plugin.settings.licenseStatus = status;
					this.plugin.settings.isPro = status.valid;
					await this.plugin.saveSettings();
					btn.setButtonText('Validate').setDisabled(false);
					if (status.valid) {
						licenseStatusEl.textContent = `License status: Active${status.customerEmail ? ` (${status.customerEmail})` : ''}`;
						licenseStatusEl.className = 'mod-success';
					} else {
						licenseStatusEl.textContent = 'License status: invalid or expired. Check your key and try again.';
						licenseStatusEl.className = 'mod-warning';
					}
				})
			);

		new Setting(containerEl)
			.addButton(btn => btn
				.setButtonText('Get Arcadia Toolbar premium')
				.onClick(() => {
					window.open('https://arcadia-studio.lemonsqueezy.com', '_blank');
				})
			);
	}
}
