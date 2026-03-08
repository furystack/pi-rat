import type { WebsocketDeviceInfo } from './device-connected-message.js'

export interface DeviceDisconnectedMessage {
  type: 'device-disconnected'
  device: WebsocketDeviceInfo
}
