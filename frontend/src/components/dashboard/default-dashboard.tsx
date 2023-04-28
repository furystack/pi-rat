import { Shade, createComponent } from '@furystack/shades'
import { Dashboard } from './index.js'
import { DashboardService } from './dashboards-service.js'
import { FullScreenLoader } from '../fullscreen-loader.js'
import { GenericErrorPage } from '../generic-error.js'

export const DefaultDashboard = Shade({
  shadowDomName: 'pi-rat-default-dashboard',
  render: ({ injector, useObservable }) => {
    const [dashboard] = useObservable(
      'defaultDashboard',
      injector.getInstance(DashboardService).getDashboardByNameAsObservable({
        filter: {
          name: {
            $eq: 'Default',
          },
        },
      }),
    )

    if (dashboard.status === 'pending') {
      return <FullScreenLoader />
    }

    if (dashboard.status === 'failed') {
      return <GenericErrorPage error={dashboard.error} />
    }

    if (dashboard.status === 'loaded') {
      return <Dashboard {...dashboard.value.entries[0]} />
    }

    return null
  },
})
