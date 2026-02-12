import type { CacheWithValue } from '@furystack/cache'
import type { GetCollectionResult } from '@furystack/rest'
import { Shade, createComponent } from '@furystack/shades'
import { CacheView, Skeleton } from '@furystack/shades-common-components'
import type { Dashboard as DashboardType } from 'common'
import { GenericErrorPage } from '../generic-error.js'
import { DashboardService } from '../../services/dashboards-service.js'
import { Dashboard } from './index.js'

const DefaultDashboardContent = Shade<{ data: CacheWithValue<GetCollectionResult<DashboardType>> }>({
  shadowDomName: 'pi-rat-default-dashboard-content',
  render: ({ props }) => {
    return <Dashboard {...props.data.value.entries[0]} />
  },
})

export const DefaultDashboard = Shade({
  shadowDomName: 'pi-rat-default-dashboard',
  render: ({ injector }) => {
    const dashboardService = injector.getInstance(DashboardService)
    return (
      <CacheView
        cache={dashboardService.dashboardQueryCache}
        args={[{ filter: { name: { $eq: 'Default' } } }]}
        content={DefaultDashboardContent}
        loader={<Skeleton />}
        error={(err, retry) => <GenericErrorPage error={err} retry={async () => retry()} />}
      />
    )
  },
})
