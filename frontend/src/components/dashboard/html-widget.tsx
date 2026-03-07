import { Shade, createComponent } from '@furystack/shades'
import type { HtmlWidget as HtmlWidgetData } from 'common'

export const HtmlWidget = Shade<HtmlWidgetData>({
  customElementName: 'pi-rat-html-widget',
  render: ({ props }) => {
    return <div innerHTML={props.content} />
  },
})
