import { createComponent } from '@furystack/shades'
import { DeviceList } from '../../pages/iot/device-list.js'
import type { MatchResult } from 'path-to-regexp'

export const iotDeviceListRoute = {
  url: '/iot/devices',
  component: () => {
    return <DeviceList />
  },
}

export const iotDeviceRoute = {
  url: '/iot/device/:id',
  component: ({ match }: { match: MatchResult<{ id: string }> }) => {
    return <div style={{ paddingTop: '5em' }}>Device {match.params.id}</div>
  },
}

export const iotRoutes = {
  [iotDeviceListRoute.url]: iotDeviceListRoute,
  [iotDeviceRoute.url]: iotDeviceRoute,
}
