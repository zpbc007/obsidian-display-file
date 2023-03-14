import { App } from 'obsidian'
import { TextInputSuggest } from './text-input-suggest'
import { dirname } from 'path'

export class FolderSuggest extends TextInputSuggest<string> {
	constructor(
		app: App,
		inputEl: HTMLInputElement | HTMLTextAreaElement,
		private readonly onSelect: (item: string) => void,
	) {
		super(app, inputEl)
	}

	getSuggestions(inputStr: string): string[] | null {
		const query = inputStr.toLowerCase()

		return Array.from(
			this.app.vault.getFiles().reduce<Set<string>>((dirSet, file) => {
				const fileDir = dirname(file.path)
				dirSet.add(fileDir)

				return dirSet
			}, new Set()),
		).filter((dir) => dir.toLowerCase().includes(query))
	}

	renderSuggestion(path: string, el: HTMLElement): void {
		el.createDiv().setText(path)
	}

	selectSuggestion(path: string): void {
		this.inputEl.value = path
		this.inputEl.trigger('input')
		this.onSelect(path)
	}
}
