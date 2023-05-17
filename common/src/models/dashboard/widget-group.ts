import type { Widget } from './widget.js'

export interface WidgetGroup {
  type: 'group'
  title: string
  widgets: Widget[]
}
