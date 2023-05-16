import { RouteLink, Shade, createComponent } from '@furystack/shades'
import type { Dashboard as DashboardData } from 'common'
import { Widget } from './widget.js'
import { Paper } from '@furystack/shades-common-components'
import { ContextMenu } from '../context-menu.js'

export const Dashboard = Shade<DashboardData>({
  shadowDomName: 'pi-rat-dashboard',
  render: ({ props }) => {
    return (
      <ContextMenu
        content={
          <div style={{ display: 'flex' }}>
            <RouteLink style={{ padding: '16px' }} href={`/entities/dashboards?mode=edit&currentId=${props.id}`}>
              📝 Edit this dashboard
            </RouteLink>
          </div>
        }>
        <Paper
          style={{
            paddingTop: '2em',
            display: 'flex',
            flexDirection: 'column',
          }}>
          {props.widgets.map((w) => (
            <Widget {...w} />
          ))}
        </Paper>
      </ContextMenu>
    )
  },
})
