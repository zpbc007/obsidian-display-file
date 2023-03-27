import {
	Component,
	MarkdownRenderer,
	Plugin,
	FileSystemAdapter,
	MarkdownPostProcessorContext,
	TFile,
	Notice,
} from 'obsidian'
import { PluginName } from './constants'
import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from './setting'
import { FileSuggest } from './suggest'
import debounce from 'lodash.debounce'
import { execSync } from 'child_process'

async function obsidianMarkdownRenderer(text: string, element: HTMLSpanElement, path: string) {
	await MarkdownRenderer.renderMarkdown(text, element, path, (null as unknown) as Component)
}

export default class DisplayFilePlugin extends Plugin {
	settings: MyPluginSettings
	files: TFile[] = []

	async onload() {
		await this.loadSettings()

		// 监听文件i树的变化
		this.listenFileTreeChange(this.syncFileTree)
		// 主动处理一次
		this.syncFileTree()

		this.listenVaultModify(debounce(this.execModifyHook, 1000))

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
			/**
			 * TODO: 查找项目地址的方式
			 * 	1. 向上查找目录
			 * 	2. 用户自己设置
			 *  3. 通过 Project Manager
			 */
			// const projectEl = el.createEl('a')
			// projectEl.setText('项目')
			// projectEl.addClass('display-file-title')
			// projectEl.href = `vscode://file//Users/zhaopeng/Documents/self-code/algorithm-battle`

			const titleEl = el.createEl('a')
			titleEl.setText(targetFile.name)
			titleEl.addClass('display-file-title')
			titleEl.href = `vscode://file/${fullPath}`
		}

		// TODO: 支持更多的文件类型
		await obsidianMarkdownRenderer(
			'```typescript\n' + fileContent + '\n```',
			el.createDiv(),
			ctx.sourcePath,
		)
	}

	/**
	 * modify: 修改文件内容触发
	 * create\delete\rename: 修改文件本身时触发
	 */
	private listenFileTreeChange = (listener: () => void) => {
		;(['create', 'delete', 'rename'] as const).forEach((eventname) =>
			this.registerEvent(this.app.vault.on(eventname as any, listener)),
		)
	}

	private listenVaultModify = (listener: () => void) => {
		// 监听文件树的改动
		this.listenFileTreeChange(listener)
		// 监听文件的改动
		this.registerEvent(this.app.vault.on('modify', listener))
	}

	private syncFileTree = () => {
		const { searchDir, includeFileRegex, excludeFileRegex } = this.settings

		this.files = this.app.vault.getFiles().filter(({ name, parent }) => {
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

	// 有任何修改执行用户的 bash 文件，可以用于文件同步
	private execModifyHook = () => {
		if (!this.settings.onModifyBash) {
			return
		}

		const env = Object.create(process.env)
		if (this.settings.shellPath) {
			env.PATH = this.settings.shellPath + env.PATH
		}
		try {
			execSync(`bash ${this.settings.onModifyBash}`, {
				env,
			})
		} catch (e) {
			console.error(e)
			new Notice(`[Display file] exec bash file error: ${e.toString()}`)
		}
	}
}
