import { Shade, createComponent } from '@furystack/shades'
import { DashboardsApiClient } from '../../services/dashboards-api-client'
import { Dashboard } from '.'
import { PiRatLazyLoad } from '../pirat-lazy-load'

export const LoadableDashboard = Shade<{ id: string }>({
  shadowDomName: 'pi-rat-loadable-dashboard',
  render: ({ injector, props }) => {
    return (
      <PiRatLazyLoad
        component={async () => {
          const dashboard = await injector.getInstance(DashboardsApiClient).call({
            method: 'GET',
            action: '/dashboards/:id',
            url: { id: props.id },
            query: {},
          })
          return <Dashboard {...dashboard.result} />
        }}
      />
    )
  },
})
