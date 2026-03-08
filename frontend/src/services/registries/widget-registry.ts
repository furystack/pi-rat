import { Injectable } from '@furystack/inject'
import type { Widget } from 'common'

export type WidgetRenderer<T = Widget> = (props: T) => JSX.Element

@Injectable({ lifetime: 'singleton' })
export class WidgetRegistry {
  private renderers = new Map<string, WidgetRenderer>()

  /**
   * Register a renderer for a known Widget union member (type-safe).
   */
  public registerWidget<T extends Widget['type']>(
    type: T,
    renderer: (props: Extract<Widget, { type: T }>) => JSX.Element,
  ): void {
    if (this.renderers.has(type)) {
      console.warn(`[WidgetRegistry] Widget type '${type}' is already registered and will be overwritten`)
    }
    this.renderers.set(type, renderer as WidgetRenderer)
  }

  /**
   * Register a renderer for a plugin-defined widget type not in the core Widget union.
   * Use this when the Widget type is extended by plugins at runtime.
   */
  public registerPluginWidget<T extends Record<string, unknown> & { type: string }>(
    type: T['type'],
    renderer: WidgetRenderer<T>,
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
