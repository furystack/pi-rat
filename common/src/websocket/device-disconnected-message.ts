import type { Device } from '../models/iot/device.js'

export interface DeviceDisconnectedMessage {
  type: 'device-disconnected'
  device: Device
}
