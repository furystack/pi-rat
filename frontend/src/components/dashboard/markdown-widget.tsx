import { Shade, createComponent } from '@furystack/shades'
import { MarkdownDisplay } from '@furystack/shades-common-components'
import type { MarkdownWidget as MarkdownWidgetData } from 'common'

export const MarkdownWidget = Shade<MarkdownWidgetData>({
  customElementName: 'pi-rat-markdown-widget',
  render: ({ props }) => {
    return <MarkdownDisplay content={props.content} />
  },
})
