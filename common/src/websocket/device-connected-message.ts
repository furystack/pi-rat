import type { Device } from '../models/iot/device.js'

export interface DeviceConnectedMessage {
  type: 'device-connected'
  device: Device
}
