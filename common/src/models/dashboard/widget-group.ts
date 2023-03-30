import type { Widget } from './widget'

export interface WidgetGroup {
  type: 'group'
  title: string
  widgets: Widget[]
}
