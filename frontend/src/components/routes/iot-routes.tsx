import { createComponent } from '@furystack/shades'
import { DeviceList } from '../../pages/iot/device-list.js'
import { onLeave, onVisit } from './route-animations.js'
import type { MatchResult } from 'path-to-regexp'

export const iotDeviceListRoute = {
  url: '/iot/devices',
  onVisit,
  onLeave,
  component: () => {
    return <DeviceList />
  },
}

export const iotDeviceRoute = {
  url: '/iot/device/:id',
  onVisit,
  onLeave,
  component: ({ match }: { match: MatchResult<{ id: string }> }) => {
    return <div style={{ paddingTop: '5em' }}>Device {match.params.id}</div>
  },
}

export const iotRoutes = [iotDeviceListRoute, iotDeviceRoute]
