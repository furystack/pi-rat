import type { Widget } from './widget'

export class Dashboard {
  id!: string
  name!: string
  description!: string
  owner!: string
  widgets!: Widget[]
  createdAt!: string
  updatedAt!: string
}
