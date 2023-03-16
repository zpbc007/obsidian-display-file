import {
	Component,
	MarkdownRenderer,
	Plugin,
	FileSystemAdapter,
	MarkdownPostProcessorContext,
	TFile,
} from 'obsidian'
import { PluginName } from './constants'
import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from './setting'
import { FileSuggest } from './suggest'

async function obsidianMarkdownRenderer(text: string, element: HTMLSpanElement, path: string) {
	await MarkdownRenderer.renderMarkdown(text, element, path, (null as unknown) as Component)
}

export default class DisplayFilePlugin extends Plugin {
	settings: MyPluginSettings
	files: TFile[] = []

	async onload() {
		await this.loadSettings()

		// 监听文件的变化
		this.listenFileTreeChange(this.syncFileTree)
		this.syncFileTree()

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this))

		/**
		 * 处理 code block:
		 * 	```display-file
		 * 	```
		 */
		this.registerMarkdownCodeBlockProcessor(PluginName, this.codeBlockProcessor)

		// 添加文件路径自动提示
		this.registerEditorSuggest(new FileSuggest(this.app, this))
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
	}

	async saveSettings() {
		await this.saveData(this.settings)
		this.syncFileTree()
	}

	private codeBlockProcessor = async (
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext,
	) => {
		const sourcePath = source.trim()
		// 获取源文件
		const targetFile = this.files.filter((item) => item.path === sourcePath)[0]

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
	}

	private genVscodeLink(projectPath: string) {
		return `vscode://file/${projectPath}`
	}

	private listenFileTreeChange = (listener: () => void) => {
		;(['create', 'delete', 'rename'] as const).forEach((eventname) =>
			this.registerEvent(this.app.vault.on(eventname as any, listener)),
		)
	}

	private syncFileTree = () => {
		const { searchDir, includeFileRegex, excludeFileRegex } = this.settings

		this.files = this.app.vault.getFiles().filter(({ path, name, parent }) => {
			// 在搜索目录内
			const fileDir = parent.path
			let result = fileDir.startsWith(searchDir)

			if (result && includeFileRegex) {
				const regex = new RegExp(includeFileRegex, 'i')
				result = regex.test(name)
			}

			if (result && excludeFileRegex) {
				const regex = new RegExp(excludeFileRegex, 'i')
				result = !regex.test(name)
			}

			return result
		})
	}
}
