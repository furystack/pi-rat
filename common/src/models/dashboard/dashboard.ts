import type { Widget } from './widget'

export interface Dashboard {
  id: string
  name: string
  description: string
  owner: string
  widgets: Widget[]
}
