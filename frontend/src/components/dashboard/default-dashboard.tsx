import { LazyLoad, Shade, createComponent } from '@furystack/shades'
import { Loader } from '@furystack/shades-common-components'
import { DashboardsApiClient } from '../../services/dashboards-api-client'
import { Dashboard } from '.'

export const DefaultDashboard = Shade({
  shadowDomName: 'pi-rat-default-dashboard',
  render: ({ injector }) => {
    return (
      <LazyLoad
        loader={<Loader />}
        component={async () => {
          const { result } = await injector.getInstance(DashboardsApiClient).call({
            method: 'GET',
            action: '/dashboards',

            query: {
              findOptions: {
                filter: {
                  name: {
                    $eq: 'Default',
                  },
                },
              },
            },
          })
          const defaultDashboard = result.entries[0] || {
            id: 'default',
            name: 'Fallback',
            description: 'Fallback Dashboard',
            widgets: [
              {
                type: 'html',
                content:
                  '<h1>Fallback Dashboard</h1><p>This is the fallback dashboard. Failed to load the original one :( </p>',
              },
            ],
          }
          return <Dashboard {...defaultDashboard} />
        }}
      />
    )
  },
})
