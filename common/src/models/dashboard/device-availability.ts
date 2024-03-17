import type { Icon } from '../icon.js'

export interface DeviceAvailability {
  type: 'device-availability'
  deviceName: string
  enableWakeUp?: boolean
  icon?: Icon
}
