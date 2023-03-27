import { App, PluginSettingTab, Setting } from 'obsidian'
import DisplayFilePlugin from './main'

export interface MyPluginSettings {
	// 查询的子目录
	searchDir: string
	// 需要被包含的文件正则
	includeFileRegex?: string
	// 需要被排除的文件正则
	excludeFileRegex?: string
	// 有任何的修改时，执行的脚本
	onModifyBash?: string
	// path 有问题，用户手动输入
	shellPath?: string
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	searchDir: '.',
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

		containerEl.createEl('h2', { text: 'Display file content plugin settings' })

		this.addTextField({
			name: 'Search Directory',
			desc: 'The file directory, default to be the root',
			placeholder: 'Enter search directory',
			valueGetter: () => this.plugin.settings.searchDir,
			onChange: (value) => (this.plugin.settings.searchDir = value),
		})

		this.addTextField({
			name: 'Include regex',
			desc: 'The file will be included',
			placeholder: 'Enter the regex',
			valueGetter: () => this.plugin.settings.includeFileRegex || '',
			onChange: (value) => (this.plugin.settings.includeFileRegex = value),
		})

		this.addTextField({
			name: 'Exclude regex',
			desc: 'The file will be excluded',
			placeholder: 'Enter the regex',
			valueGetter: () => this.plugin.settings.excludeFileRegex || '',
			onChange: (value) => (this.plugin.settings.excludeFileRegex = value),
		})

		this.addTextField({
			name: 'Bash file',
			desc: 'This file will be executed when any change in the vault',
			placeholder: 'Enter the bash file path',
			valueGetter: () => this.plugin.settings.onModifyBash || '',
			onChange: (value) => (this.plugin.settings.onModifyBash = value),
		})

		this.addTextField({
			name: 'Bash file path',
			desc: 'Shell path to execute bash',
			placeholder: 'Enter the bash path',
			valueGetter: () => this.plugin.settings.shellPath || '',
			onChange: (value) => (this.plugin.settings.shellPath = value),
		})

		// new Setting(containerEl)
		// 	.setName('Search Directory')
		// 	.setDesc('The file directory, default to be the root')
		// 	.addText((text) => {
		// 		text.setPlaceholder('Enter search directory')
		// 			.setValue(this.plugin.settings.searchDir)
		// 			.onChange(async (directory) => {
		// 				this.plugin.settings.searchDir = directory
		// 				await this.plugin.saveSettings()
		// 			})
		// 	})
		// .addSearch((search) => {
		// 	new FolderSuggest(this.app, search.inputEl, (path) => {
		// 		this.plugin.settings.searchDir = path
		// 	})
		// })
	}

	private addTextField({
		name,
		desc,
		placeholder,
		valueGetter,
		onChange,
	}: {
		name: string
		desc: string
		placeholder: string
		valueGetter: () => string
		onChange: (value: string) => void
	}) {
		new Setting(this.containerEl)
			.setName(name)
			.setDesc(desc)
			.addText((text) => {
				text.setPlaceholder(placeholder)
					.setValue(valueGetter())
					.onChange(async (newValue) => {
						onChange(newValue)
						await this.plugin.saveSettings()
					})
			})
	}
}
