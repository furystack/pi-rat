import type { Widget } from './widget'

export interface HtmlWidget {
  type: 'html'
  content: string
}

export const isHtmlWidget = (widget: Widget): widget is HtmlWidget => {
  return widget.type === 'html'
}
