import { Shade, createComponent } from '@furystack/shades'
import type { Widget as WidgetData } from 'common'
import { HtmlWidget } from './html-widget'
import { MarkdownWidget } from './markdown-widget'
import { AppShortcutWidget } from './app-shortcut-widget'
import { WidgetGroup } from './widget-group'
import { EntityShortcutWidget } from './entity-shortcut-widget'

export const Widget = Shade<WidgetData>({
  shadowDomName: 'pi-rat-widget',
  render: ({ props }) => {
    switch (props.type) {
      case 'app-shortcut': {
        return <AppShortcutWidget {...props} />
      }
      case 'entity-shortcut': {
        return <EntityShortcutWidget {...props} />
      }
      case 'html':
        return <HtmlWidget {...props} />
      case 'markdown': {
        return <MarkdownWidget {...props} />
      }
      case 'group':
        return <WidgetGroup {...props} />
      default: {
        return <div>{(props as any).type}</div>
      }
    }
  },
})
