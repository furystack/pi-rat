import { Shade, createComponent } from '@furystack/shades'
import { Typography } from '@furystack/shades-common-components'
import type { WidgetGroup as WidgetGroupData } from 'common'
import { Widget } from './widget.js'

export const WidgetGroup = Shade<WidgetGroupData>({
  shadowDomName: 'pi-rat-widget-group',
  css: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'hidden',
    padding: '1em',
    '& .widget-group-container': {
      overflow: 'hidden',
      maxWidth: '100%',
    },
    '& .widget-list': {
      display: 'flex',
      overflow: 'auto',
      scrollSnapType: 'x mandatory',
    },
    '& .widget-item': {
      scrollSnapAlign: 'start',
    },
  },
  render: ({ props }) => {
    return (
      <div className="widget-group-container">
        <Typography variant="h3">{props.title}</Typography>
        <div className="widget-list">
          {props.widgets.map((w) => (
            <div className="widget-item">
              <Widget {...w} />
            </div>
          ))}
        </div>
      </div>
    )
  },
})
