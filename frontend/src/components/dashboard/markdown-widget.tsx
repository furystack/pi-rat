import { Shade, createComponent } from '@furystack/shades'
import type { MarkdownWidget as MarkdownWidgetData } from 'common'
import { marked } from 'marked'

export const MarkdownWidget = Shade<MarkdownWidgetData>({
  shadowDomName: 'pi-rat-markdown-widget',
  render: ({ props }) => {
    return <div innerHTML={marked(props.content) as string} />
  },
})
