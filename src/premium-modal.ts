import { App, Modal, Notice, Setting } from 'obsidian';
import { validateLicense, LicenseStatus } from './license';

interface PremiumPlugin {
	settings: {
		licenseKey: string;
		licenseStatus: LicenseStatus | null;
		isPro: boolean;
	};
	saveSettings(): Promise<void>;
}

export class PremiumModal extends Modal {
	private plugin: PremiumPlugin;
	private featureName: string;
	private textInputEl: HTMLInputElement | null = null;
	private validating = false;

	constructor(app: App, plugin: PremiumPlugin, featureName: string) {
		super(app);
		this.plugin = plugin;
		this.featureName = featureName;
	}

	onOpen(): void {
		const { contentEl } = this;
		new Setting(contentEl).setName('Premium feature').setHeading();
		contentEl.createEl('p', {
			text: `"${this.featureName}" is part of Arcadia Toolbar premium.`,
		});
		contentEl.createEl('p', {
			text: 'Purchase a license to unlock all premium features, or enter your existing license key below.',
			cls: 'setting-item-description',
		});

		const statusEl = contentEl.createEl('p', { cls: 'setting-item-description' });

		new Setting(contentEl)
			.setName('License key')
			.setDesc('Enter your license key')
			.addText(text => {
				this.textInputEl = text.inputEl;
				text
					.setPlaceholder('Xxxx-xxxx-xxxx-xxxx')
					.onChange(async (value) => {
						const key = value.trim();
						if (key.length <= 10 || this.validating) return;
						this.validating = true;
						statusEl.setText('Checking license key...');
						try {
							const result = await validateLicense(key);
							if (result.outcome === 'valid') {
								this.plugin.settings.licenseKey = key;
								this.plugin.settings.licenseStatus = result.status;
								this.plugin.settings.isPro = true;
								await this.plugin.saveSettings();
								new Notice('License activated. Premium features are now unlocked.');
								this.close();
							} else {
								statusEl.setText(result.message);
							}
						} finally {
							this.validating = false;
						}
					});
			});

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Get premium')
				.setCta()
				.onClick(() => {
					window.open('https://arcadia-studio.lemonsqueezy.com', '_blank');
				})
			)
			.addButton(btn => btn
				.setButtonText('I have a license key')
				.onClick(() => {
					if (this.textInputEl) {
						this.textInputEl.focus();
					}
				})
			);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
