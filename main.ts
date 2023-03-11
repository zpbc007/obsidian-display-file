import {
	App,
	Component,
	Editor,
	MarkdownRenderer,
	Plugin,
	PluginSettingTab,
	Setting,
	EditorSuggest,
	EditorPosition,
	EditorSuggestContext,
	TFile,
	EditorSuggestTriggerInfo,
	FileSystemAdapter,
} from 'obsidian'

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
}

async function obsidianMarkdownRenderer(text: string, element: HTMLSpanElement, path: string) {
	await MarkdownRenderer.renderMarkdown(text, element, path, (null as unknown) as Component)
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings

	async onload() {
		await this.loadSettings()

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this))

		this.registerMarkdownCodeBlockProcessor('display-file', async (source, el, ctx) => {
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

		this.registerEditorSuggest(new FileSuggest(this.app, new FileCacheStore(this.app)))
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin

	constructor(app: App, plugin: MyPlugin) {
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

interface Suggestion {
	path: string
	startPos: EditorPosition
}
class FileSuggest extends EditorSuggest<Suggestion> {
	constructor(private readonly app: App, private readonly fileStore: FileCacheStore) {
		super(app)
	}

	getSuggestions(context: EditorSuggestContext): Suggestion[] | Promise<Suggestion[]> {
		return this.fileStore.getFiles().map<Suggestion>((item) => ({
			path: item.path,
			startPos: {
				...context.start,
				ch: 0,
			},
		}))
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		file: TFile,
	): EditorSuggestTriggerInfo | null {
		if (cursor.line - 1 < 0) {
			return null
		}
		const line = editor.getLine(cursor.line - 1)
		const matched = line.includes('display-file')

		if (!matched) {
			return null
		}

		return {
			start: {
				...cursor,
				ch: 0,
			},
			end: cursor,
			query: 'xxx',
		}
	}

	renderSuggestion(value: Suggestion, el: HTMLElement): void {
		const div = el.doc.createElement('div')
		div.setText(value.path)

		el.appendChild(div)
	}

	selectSuggestion({ path, startPos }: Suggestion, evt: MouseEvent | KeyboardEvent): void {
		const endCh = this.context?.editor.getLine(startPos.line).length || 0
		this.context?.editor.replaceRange(path, startPos, {
			line: startPos.line,
			ch: endCh,
		})
	}
}

class FileCacheStore {
	private fileCache: TFile[] = []
	constructor(private readonly app: App) {}

	getFiles() {
		return this.app.vault.getFiles()
	}

	/**
	 * TODO: 根据配置，只保存对应目录下的文件
	 */
	private updateCache() {
		this.fileCache = this.app.vault.getFiles()
	}

	private listenEvent() {
		const myUpdateCache = this.updateCache.bind(this)
		this.app.vault.on('create', myUpdateCache)
		this.app.vault.on('delete', myUpdateCache)
		this.app.vault.on('rename', myUpdateCache)
	}
}
