import { Shade, createComponent } from '@furystack/shades'
import { Dashboard } from '.'
import { PiRatLazyLoad } from '../pirat-lazy-load'
import { DashboardService } from './dashboards-service'

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
