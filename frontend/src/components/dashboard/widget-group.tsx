import { Shade, createComponent } from '@furystack/shades'
import type { WidgetGroup as WidgetGroupData } from 'common'
import { Widget } from './widget.js'

export const WidgetGroup = Shade<WidgetGroupData>({
  shadowDomName: 'pi-rat-widget-group',
  render: ({ props }) => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden',
          padding: '1em',
        }}>
        <div style={{ overflow: 'hidden', maxWidth: '100%' }}>
          <h3>{props.title}</h3>
          <div style={{ display: 'flex', overflow: 'auto', scrollSnapType: 'x mandatory' } as any}>
            {props.widgets.map((w) => (
              <div style={{ scrollSnapAlign: 'start' } as any}>
                <Widget {...w} />
                {/* <MovieWidget movie={movie} index={index} size={props.size || 64} /> */}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },
})
