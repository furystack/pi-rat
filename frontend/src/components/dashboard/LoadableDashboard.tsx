import { Shade, createComponent } from '@furystack/shades'
import { Dashboard } from './index.js'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'
import { DashboardService } from '../../services/dashboards-service.js'

export const LoadableDashboard = Shade<{ id: string }>({
  shadowDomName: 'pi-rat-loadable-dashboard',
  render: ({ injector, props }) => {
    return (
      <PiRatLazyLoad
        component={async () => {
          const dashboard = await injector.getInstance(DashboardService).getDashboard(props.id)
          return <Dashboard {...dashboard} />
        }}
      />
    )
  },
})
