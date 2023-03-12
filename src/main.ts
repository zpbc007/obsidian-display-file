import { Component, MarkdownRenderer, Plugin, FileSystemAdapter } from 'obsidian'
import { PluginName } from './constants'
import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from './setting'
import { FileSuggest } from './suggest'

async function obsidianMarkdownRenderer(text: string, element: HTMLSpanElement, path: string) {
	await MarkdownRenderer.renderMarkdown(text, element, path, (null as unknown) as Component)
}

export default class DisplayFilePlugin extends Plugin {
	settings: MyPluginSettings

	async onload() {
		await this.loadSettings()

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this))

		this.registerMarkdownCodeBlockProcessor(PluginName, async (source, el, ctx) => {
			const sourcePath = source.trim()
			// 获取源文件
			const targetFile = this.app.vault
				.getFiles()
				.filter((item) => item.path === sourcePath)[0]
			console.log('targetFile: ', targetFile)

			// 没找到
			if (!targetFile) {
				return
			}

			const fileContent = await this.app.vault.cachedRead(targetFile)

			let fullPath = ''
			if (this.app.vault.adapter instanceof FileSystemAdapter) {
				fullPath = `${this.app.vault.adapter.getBasePath()}/${targetFile.path}`
			}

			if (fullPath) {
				const projectEl = el.createEl('a')
				projectEl.setText('项目')
				projectEl.addClass('display-file-title')
				projectEl.href = `vscode://file//Users/zhaopeng/Documents/self-code/algorithm-battle`

				const titleEl = el.createEl('a')
				titleEl.setText(targetFile.name)
				titleEl.addClass('display-file-title')
				titleEl.href = `vscode://file/${fullPath}?workspace=/Users/zhaopeng/Documents/self-code/algorithm-battle`
			}

			await obsidianMarkdownRenderer(
				'```typescript\n' + fileContent + '\n```',
				el.createDiv(),
				ctx.sourcePath,
			)
		})

		this.registerEditorSuggest(new FileSuggest(this.app))
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}

	private getFiles() {
		return this.app.vault.getFiles()
	}
}
