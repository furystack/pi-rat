import { Shade, createComponent } from '@furystack/shades'
import type { Widget as WidgetData } from 'common'
import { AppShortcutWidget } from './app-shortcut-widget.js'
import { ContinueWatchingWidgetGroup } from './continue-watching.js'
import { DeviceAvailability } from './device-availability.js'
import { EntityShortcutWidget } from './entity-shortcut-widget.js'
import { HtmlWidget } from './html-widget.js'
import { MarkdownWidget } from './markdown-widget.js'
import { MovieWidget } from './movie-widget.js'
import { SeriesWidget } from './series-widget.js'
import { WidgetGroup } from './widget-group.js'

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
      case 'movie': {
        return <MovieWidget {...props} />
      }
      case 'series': {
        return <SeriesWidget {...props} />
      }
      case 'continue-watching': {
        return <ContinueWatchingWidgetGroup {...props} />
      }
      case 'device-availability':
        return <DeviceAvailability {...props} />
      default: {
        return <div>{props}</div>
      }
    }
  },
})
