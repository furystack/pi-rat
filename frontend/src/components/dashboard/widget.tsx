import { Shade, createComponent } from '@furystack/shades'
import type { Widget as WidgetData } from 'common'
import { WidgetRegistry } from '../../services/registries/index.js'

export const Widget = Shade<WidgetData>({
  customElementName: 'pi-rat-widget',
  render: ({ props, injector }) => {
    const registry = injector.getInstance(WidgetRegistry)
    const renderer = registry.getRenderer(props.type)
    if (renderer) {
      return renderer(props)
    }
    return <div>Unknown widget type: {props.type}</div>
  },
})
