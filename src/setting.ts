import { App, PluginSettingTab, Setting } from 'obsidian'
import DisplayFilePlugin from './main'

export interface MyPluginSettings {
	mySetting: string
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
}

export class SampleSettingTab extends PluginSettingTab {
	plugin: DisplayFilePlugin

	constructor(app: App, plugin: DisplayFilePlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const { containerEl } = this

		containerEl.empty()

		containerEl.createEl('h2', { text: 'zpxxx Settings for my awesome plugin.' })

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder('Enter your secret')
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						console.log('Secret: ' + value)
						this.plugin.settings.mySetting = value
						await this.plugin.saveSettings()
					}),
			)
	}
}
