import { ISuggestOwner, Scope } from 'obsidian'

const OptionItemClass = 'suggestion-item'

/**
 * 在设置面板中的 Suggest
 */
export class SettingSuggest<T> {
	private suggestionEls: HTMLDivElement[] = []
	private values: T[] = []
	private selectedIndex: number = 0

	constructor(
		// 渲染、选择 suggest
		private readonly owner: ISuggestOwner<T>,
		// 父容器
		private readonly containerEl: HTMLElement,
		// 监听键盘事件
		scope: Scope,
	) {
		// 鼠标移动高亮
		containerEl.on('mouseover', `.${OptionItemClass}`, this.onSuggestionMouseover)
		// 点击选择选项
		containerEl.on('click', `.${OptionItemClass}`, this.onSuggestionClick)

		// 键盘高亮
		scope.register([], 'ArrowUp', (event) => {
			if (!event.isComposing) {
				this.updateSelectedItem(this.selectedIndex - 1, true)
				return false
			}
		})
		scope.register([], 'ArrowDown', (event) => {
			if (!event.isComposing) {
				this.updateSelectedItem(this.selectedIndex + 1, true)
				return false
			}
		})

		// 回车选择选项
		scope.register([], 'Enter', (event) => {
			if (!event.isComposing) {
				this.useSelectedItem(event)
				return false
			}
		})
	}

	// 更新选项
	setSuggestions(values: T[]) {
		this.containerEl.empty()
		this.selectedIndex = 0

		this.suggestionEls = values.map((value) => {
			const el = this.containerEl.createDiv(OptionItemClass)
			this.owner.renderSuggestion(value, el)

			return el
		})
		this.values = values
	}

	// 点击选项
	private onSuggestionClick = (event: MouseEvent, el: HTMLDivElement) => {
		event.preventDefault()

		const item = this.suggestionEls.indexOf(el)
		this.updateSelectedItem(item, false)
		this.useSelectedItem(event)
	}

	// 鼠标移动
	private onSuggestionMouseover = (event: MouseEvent, el: HTMLDivElement) => {
		const index = this.suggestionEls.indexOf(el)
		this.updateSelectedItem(index, false)
	}

	// 确认选择某个选项
	private useSelectedItem(event: MouseEvent | KeyboardEvent) {
		const value = this.values[this.selectedIndex]
		if (value) {
			this.owner.selectSuggestion(value, event)
		}
	}

	// 更新待选项
	private updateSelectedItem(index: number, scrollIntoView: boolean) {
		const normalizedIndex = this.normalizeIndex(index, this.values.length)

		const preSelectedSuggestion = this.suggestionEls[this.selectedIndex]
		const curSelectedSuggestion = this.suggestionEls[normalizedIndex]

		// 更新当前选中项
		this.selectedIndex = normalizedIndex

		// 更新 class
		preSelectedSuggestion.removeClass('odf-selected')
		curSelectedSuggestion.addClass('odf-selected')

		if (scrollIntoView) {
			curSelectedSuggestion.scrollIntoView(false)
		}
	}

	// 转为正常的数组下标
	private normalizeIndex(value: number, size: number) {
		return ((value % size) + size) % size
	}
}
