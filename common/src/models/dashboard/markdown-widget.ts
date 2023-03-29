import type { Widget } from './widget'

export interface MarkdownWidget {
  type: 'markdown'
  content: string
}

export const isMarkdownWidget = (widget: Widget): widget is MarkdownWidget => {
  return widget.type === 'markdown'
}
