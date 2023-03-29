import type { Widget } from './widget'

export interface WidgetGroup {
  type: 'group'
  title: string
  widgets: Widget[]
}

export const isWidgetGroup = (widget: Widget): widget is WidgetGroup => {
  return widget.type === 'group'
}
