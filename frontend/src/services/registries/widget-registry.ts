import { Injectable } from '@furystack/inject'

export type WidgetRenderer = (props: unknown) => JSX.Element

@Injectable({ lifetime: 'singleton' })
export class WidgetRegistry {
  private renderers = new Map<string, WidgetRenderer>()

  public registerWidget(type: string, renderer: WidgetRenderer) {
    this.renderers.set(type, renderer)
  }

  public getRenderer(type: string): WidgetRenderer | undefined {
    return this.renderers.get(type)
  }
}
