import { Shade, createComponent } from '@furystack/shades'
import type { Dashboard as DashboardData } from 'common'
import { Widget } from './widget.js'
import { ContextMenu } from '../context-menu.js'
import { SessionService } from '../../services/session.js'
import { navigateToRoute } from '../../navigate-to-route.js'
import { serializeToQueryString } from '@furystack/rest'

export const Dashboard = Shade<DashboardData>({
  shadowDomName: 'pi-rat-dashboard',
  render: ({ props, injector, useObservable }) => {
    const [currentUser] = useObservable('currentUser', injector.getInstance(SessionService).currentUser)

    return (
      <div
        style={{
          marginTop: '48px',
          scrollPaddingTop: '48px',
        }}
      >
        <ContextMenu
          items={[
            ...(currentUser?.username === props.owner || currentUser?.roles.includes('admin')
              ? [
                  {
                    icon: { type: 'font', value: '📝' } as const,
                    label: 'Edit this dashboard',
                    onClick: () => {
                      navigateToRoute(
                        injector,
                        '/entities/dashboards',
                        {},
                        {
                          queryString: serializeToQueryString({ gedst: { currentId: props.id, mode: 'edit' } }),
                        },
                      )
                    },
                  },
                ]
              : []),
          ]}
        >
          {props.widgets.map((w) => (
            <Widget {...w} />
          ))}
        </ContextMenu>
      </div>
    )
  },
})
