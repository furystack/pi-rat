import { LocationService, Shade, createComponent } from '@furystack/shades'
import type { Dashboard as DashboardData } from 'common'
import { Widget } from './widget.js'
import { Paper } from '@furystack/shades-common-components'
import { ContextMenu } from '../context-menu.js'
import { SessionService } from '../../services/session.js'
import { navigateToRoute } from '../../navigate-to-route.js'
import { entityDashboardsRoute } from '../routes/entity-routes.js'

export const Dashboard = Shade<DashboardData>({
  shadowDomName: 'pi-rat-dashboard',
  render: ({ props, injector, useObservable }) => {
    const [currentUser] = useObservable('currentUser', injector.getInstance(SessionService).currentUser)

    return (
      <ContextMenu
        items={[
          ...(currentUser?.username === props.owner || currentUser?.roles.includes('admin')
            ? [
                {
                  icon: '📝',
                  label: 'Edit this dashboard',
                  onClick: () => {
                    navigateToRoute(injector, entityDashboardsRoute, {}, `mode=edit&currentId=${props.id}`)

                    injector.getInstance(LocationService).updateState()
                  },
                },
              ]
            : []),
        ]}>
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
