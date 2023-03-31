import { LazyLoad, Shade, createComponent } from '@furystack/shades'
import { Loader } from '@furystack/shades-common-components'
import { DashboardsApiClient } from '../../services/dashboards-api-client'
import { Dashboard } from '.'

export const LoadableDashboard = Shade<{ id: string }>({
  shadowDomName: 'pi-rat-loadable-dashboard',
  render: ({ injector, props }) => {
    return (
      <LazyLoad
        loader={<Loader />}
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
