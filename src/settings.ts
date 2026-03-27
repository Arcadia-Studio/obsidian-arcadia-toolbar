import { App, PluginSettingTab, Setting } from 'obsidian';
import type { ArcadiaPluginInterface } from './types';
import { BIBLE_TRANSLATIONS, COMMENTARIES, BIBLE_DICTIONARIES, AI_PROVIDERS } from './types';

export class ArcadiaToolbarSettingTab extends PluginSettingTab {
	plugin: ArcadiaPluginInterface;

	constructor(app: App, plugin: ArcadiaPluginInterface & { addSettingTab?: unknown }) {
		super(app, plugin as unknown as import('obsidian').Plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Arcadia Toolbar Settings' });

		// Tab Visibility
		containerEl.createEl('h3', { text: 'Ribbon Tabs' });

		const tabToggles: { key: string; name: string; desc: string }[] = [
			{ key: 'showHomeTab', name: 'Show Home tab', desc: 'Text formatting, colors, headings, lists, alignment' },
			{ key: 'showInsertTab', name: 'Show Insert tab', desc: 'Links, images, tables, code, callouts, footnotes' },
			{ key: 'showTheologyTab', name: 'Show Theology tab', desc: 'Scripture blocks, cross-references, original language notes' },
			{ key: 'showViewTab', name: 'Show View tab', desc: 'Table of Contents, word count, display options' },
			{ key: 'showNavigateTab', name: 'Show Navigate tab', desc: 'Search, history, links, file explorer, workspace management' },
			{ key: 'showTemplatesTab', name: 'Show Templates tab', desc: 'Quick insert templates, daily notes, note tools, properties' },
			{ key: 'showCanvasTab', name: 'Show Canvas tab', desc: 'Canvas, Excalidraw, presentations, Mermaid and PlantUML' },
			{ key: 'showReferencesTab', name: 'Show References tab', desc: 'Citations (Turabian, Chicago, APA, MLA), bibliography, footnotes' },
			{ key: 'showReviewTab', name: 'Show Review tab', desc: 'Spell check, search, backlinks, speech, comments, statistics' },
			{ key: 'showDataTab', name: 'Show Data tab', desc: 'Tables, rows/columns, sort, CSV, formulas, charts, AI tools' },
			{ key: 'showSlidesTab', name: 'Show Slides tab', desc: 'Presentation mode, slide separators, themes (Advanced Slides)' },
		];

		for (const tab of tabToggles) {
			new Setting(containerEl)
				.setName(tab.name)
				.setDesc(tab.desc)
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.addToggle(t => t.setValue((this.plugin.settings as any)[tab.key] as boolean)
					.onChange(async v => {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(this.plugin.settings as any)[tab.key] = v;
						await this.plugin.saveSettings();
						this.plugin.updateToolbar();
					}));
		}

		// TOC Settings
		containerEl.createEl('h3', { text: 'Table of Contents' });

		new Setting(containerEl)
			.setName('Pin TOC on startup')
			.setDesc('Automatically open the TOC panel when Obsidian starts')
			.addToggle(t => t.setValue(this.plugin.settings.tocShowOnStartup)
				.onChange(async v => {
					this.plugin.settings.tocShowOnStartup = v;
					this.plugin.settings.tocPinned = v;
					await this.plugin.saveSettings();
				}));

		// Scripture Settings
		containerEl.createEl('h3', { text: 'Scripture' });

		new Setting(containerEl)
			.setName('Default translation')
			.setDesc('Default Bible translation for scripture blocks')
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
		containerEl.createEl('h3', { text: 'Scripture Hover Lookup' });

		containerEl.createEl('p', {
			text: 'Hover over any scripture reference (e.g., John 3:16) to see a floating popup with Bible text, commentary, or dictionary content. Toggle modes from the Theology tab.',
			cls: 'setting-item-description',
		});

		new Setting(containerEl)
			.setName('Hover Bible translation')
			.setDesc('Translation used for Bible hover popups (bible-api.com supports KJV, ASV, BBE, WEB, YLT)')
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
		containerEl.createEl('h3', { text: 'AI Integration' });

		containerEl.createEl('p', {
			text: 'Connect an AI provider to enable citation conversion, Google Books linking, and notes-to-slides features. AI-powered buttons appear grayed out until configured.',
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
			.setName('AI Provider')
			.setDesc('Choose your AI service provider')
			.addDropdown(d => {
				d.addOption('none', '\u2014 None \u2014');
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
			.setName('API Key')
			.setDesc("Your API key (stored locally in this vault's data.json)")
			.addText(t => {
				t.inputEl.type = 'password';
				t.inputEl.style.width = '300px';
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
	}
}
