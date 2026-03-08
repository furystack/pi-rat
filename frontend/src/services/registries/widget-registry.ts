import { Injectable } from '@furystack/inject'
import type { Widget } from 'common'

export type WidgetRenderer = (props: Widget) => JSX.Element

@Injectable({ lifetime: 'singleton' })
export class WidgetRegistry {
  private renderers = new Map<string, WidgetRenderer>()

  public registerWidget<T extends Widget['type']>(
    type: T,
    renderer: (props: Extract<Widget, { type: T }>) => JSX.Element,
  ): void {
    if (this.renderers.has(type)) {
      console.warn(`[WidgetRegistry] Widget type '${type}' is already registered and will be overwritten`)
    }
    this.renderers.set(type, renderer as WidgetRenderer)
  }

  public getRenderer(type: string): WidgetRenderer | undefined {
    return this.renderers.get(type)
  }
}
