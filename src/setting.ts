import { App, PluginSettingTab, Setting } from 'obsidian'
import DisplayFilePlugin from './main'
import { FolderSuggest } from './settings/folder-suggest'

export interface MyPluginSettings {
	// 查询的子目录
	searchDir: string
	// 需要被包含的文件正则
	includeFileRegex?: string
	// 需要被排除的文件正则
	excludeFileRegex?: string
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	searchDir: '/',
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

		containerEl.createEl('h2', { text: 'Display file content settings' })

		new Setting(containerEl)
			.setName('Search Directory')
			.setDesc('The file directory, default to be the root')
			.addSearch((search) => {
				new FolderSuggest(this.app, search.inputEl, (path) => {
					this.plugin.settings.searchDir = path
				})
			})
		// .add
		// .addDropdown((dropDown) => {
		// 	dropDown
		// 		.addOptions({
		// 			'/a': '/a',
		// 			'/a/b': '/a/b',
		// 			'/a/b/c': '/a/b/c',
		// 		})
		// 		.setValue(this.plugin.settings.searchDir)
		// 		.onChange(async (value) => {
		// 			this.plugin.settings.searchDir = value
		// 			await this.plugin.saveSettings()
		// 		})
		// })

		// new Setting(containerEl)
		// 	.setName('Setting #1')
		// 	.setDesc("It's a secret")
		// 	.addText((text) =>
		// 		text
		// 			.setPlaceholder('Enter your secret')
		// 			.setValue(this.plugin.settings.mySetting)
		// 			.onChange(async (value) => {
		// 				console.log('Secret: ' + value)
		// 				this.plugin.settings.mySetting = value
		// 				await this.plugin.saveSettings()
		// 			}),
		// 	)
	}
}
