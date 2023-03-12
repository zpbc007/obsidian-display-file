import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile,
} from 'obsidian'
import { PluginName } from './constants'

interface Suggestion {
	path: string
	startPos: EditorPosition
}

export class FileSuggest extends EditorSuggest<Suggestion> {
	constructor(private readonly app: App) {
		super(app)
	}

	getSuggestions(context: EditorSuggestContext): Suggestion[] | Promise<Suggestion[]> {
		// TODO: 根据 query 过滤
		context.query
		return this.app.vault.getFiles().map<Suggestion>((item) => ({
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
		// TODO: 这里需要判断下是不是 code block
		const matched = line.includes(PluginName)
		debugger

		if (!matched) {
			return null
		}

		// TODO: 解析出 query

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
