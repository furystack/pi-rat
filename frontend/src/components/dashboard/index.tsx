import { Shade, createComponent } from '@furystack/shades'
import type { ContextMenuItem } from '@furystack/shades-common-components'
import { ContextMenu, ContextMenuManager } from '@furystack/shades-common-components'
import type { Dashboard as DashboardData } from 'common'
import { navigateToRoute } from '../../navigate-to-route.js'
import { SessionService } from '../../services/session.js'
import { Widget } from './widget.js'

export const Dashboard = Shade<DashboardData>({
  shadowDomName: 'pi-rat-dashboard',
  render: ({ props, injector, useObservable, useDisposable }) => {
    const [currentUser] = useObservable('currentUser', injector.getInstance(SessionService).currentUser)

    const manager = useDisposable('contextMenuManager', () => new ContextMenuManager<() => void>())

    const getItems = (): Array<ContextMenuItem<() => void>> => [
      ...(currentUser?.username === props.owner || currentUser?.roles.includes('admin')
        ? [
            {
              type: 'item' as const,
              icon: <span>📝</span>,
              label: 'Edit this dashboard',
              data: () => {
                navigateToRoute(injector, '/entities/dashboards/edit/:id', { id: props.id })
              },
            },
          ]
        : []),
    ]

    return (
      <>
        <div
          oncontextmenu={(ev: MouseEvent) => {
            ev.preventDefault()
            manager.open({
              position: { x: ev.clientX, y: ev.clientY },
              items: getItems(),
            })
          }}
        >
          {props.widgets.map((w) => (
            <Widget {...w} />
          ))}
        </div>
        <ContextMenu manager={manager} onItemSelect={(action) => action()} />
      </>
    )
  },
})
