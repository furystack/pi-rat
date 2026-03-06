import { createComponent, type TitleResolverOptions } from '@furystack/shades'
import { icons } from '@furystack/shades-common-components'
import type { MatchResult } from 'path-to-regexp'
import { PiRatLazyLoad } from '../components/pirat-lazy-load.js'

export const iotRoute = {
  meta: { title: 'IoT', icon: icons.plug },
  component: ({ outlet }: { outlet?: JSX.Element }) => (
    <PiRatLazyLoad
      component={async () => {
        const { RouteIndexPage } = await import('../components/route-index-page.js')
        return <RouteIndexPage outlet={outlet} />
      }}
    />
  ),
  children: {
    '/devices': {
      meta: { title: 'Devices', icon: icons.plug },
      component: () => (
        <PiRatLazyLoad
          component={async () => {
            const { DeviceList } = await import('../pages/iot/device-list.js')
            return <DeviceList />
          }}
        />
      ),
      children: {
        '/:id': {
          meta: {
            title: ({ match }: TitleResolverOptions<{ id: string }>): string => `Device ${match.params.id}`,
            hidden: true,
          },
          component: ({ match }: { match: MatchResult<{ id: string }> }) => (
            <div style={{ paddingTop: '5em' }}>Device {match.params.id}</div>
          ),
        },
        '/': { component: () => <></>, routingOptions: { end: false } },
      },
    },
    '/': {
      component: () => <></>,
      routingOptions: { end: false },
    },
  },
}
