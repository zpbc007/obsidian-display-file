import { App, ISuggestOwner, Scope } from 'obsidian'
import { SettingSuggest } from './suggest'
import { createPopper, Instance as PopoverInstance } from '@popperjs/core'

const ContainerClass = 'suggestion-container'

export abstract class TextInputSuggest<T> implements ISuggestOwner<T> {
	private readonly scope = new Scope()
	private readonly containerEl: HTMLDivElement
	private readonly settingSuggest: SettingSuggest<T>
	private popover: PopoverInstance | null = null
	private opened = false

	constructor(
		protected readonly app: App,
		protected readonly inputEl: HTMLInputElement | HTMLTextAreaElement,
	) {
		this.containerEl = createDiv(ContainerClass)
		this.settingSuggest = new SettingSuggest(this, this.containerEl, this.scope)

		// 输入展示
		inputEl.addEventListener('input', this.onInputChange)
		inputEl.addEventListener('focus', this.onInputChange)

		/**
		 * 这里不能监听 Esc 关闭
		 * ob 应该默认会监听 Esc 用于清空 input，同时会触发 input 事件，导致关闭逻辑失效
		 */
		// this.scope.register([], 'Escape', this.close)
		// 鼠标关闭
		inputEl.addEventListener('blur', this.close)
		// 避免被点击时，触发 input 的 blur
		this.containerEl.on('mousedown', `.${ContainerClass}`, (event: MouseEvent) => {
			event.preventDefault()
		})
	}

	// 根据输入查询选项
	abstract getSuggestions(inputStr: string): T[] | null
	// 渲染单个选项
	abstract renderSuggestion(value: T, el: HTMLElement): void
	// 选中选项
	abstract selectSuggestion(item: T): void

	private onInputChange = () => {
		const str = this.inputEl.value
		const suggestions = this.getSuggestions(str)

		if (!suggestions || suggestions.length === 0) {
			return this.close()
		}

		this.settingSuggest.setSuggestions(suggestions)
		this.open()
	}

	private close = () => {
		if (!this.opened) {
			return
		}
		// 取消事件监听
		this.app.keymap.popScope(this.scope)

		// 删除容器节点
		this.containerEl.detach()
		// 删除下拉框实例
		if (this.popover) {
			this.popover.destroy()
			this.popover = null
		}
		// 重置下拉框
		this.settingSuggest.setSuggestions([])
		this.opened = false
	}

	private open = () => {
		if (this.opened) {
			return
		}

		// 监听事件
		this.app.keymap.pushScope(this.scope)

		// 插入容器节点
		const parent = this.inputEl.parentElement
		parent?.appendChild(this.containerEl)

		// 展示下拉框
		this.popover = createPopper(this.inputEl, this.containerEl, { placement: 'bottom-start' })
		this.opened = true
	}
}
