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
import DisplayFilePlugin from './main'

interface Suggestion {
	path: string
	startPos: EditorPosition
}

export class FileSuggest extends EditorSuggest<Suggestion> {
	constructor(private readonly app: App, private readonly plugin: DisplayFilePlugin) {
		super(app)
	}

	getSuggestions(context: EditorSuggestContext): Suggestion[] | Promise<Suggestion[]> {
		return this.plugin.files
			.filter((item) => item.path.toLowerCase().includes(context.query))
			.map<Suggestion>((item) => ({
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
		const matched = line.includes('```' + PluginName)
		if (!matched) {
			return null
		}

		return {
			start: {
				...cursor,
				ch: 0,
			},
			end: cursor,
			query: editor.getLine(cursor.line).toLowerCase(),
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
