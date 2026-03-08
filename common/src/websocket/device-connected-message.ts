/** Minimal device identification info shared via websocket messages.
 * Intentionally decoupled from the full Device model in @pi-rat/iot-common. */
export type WebsocketDeviceInfo = {
  name: string
  ipAddress?: string
  macAddress?: string
}

export interface DeviceConnectedMessage {
  type: 'device-connected'
  device: WebsocketDeviceInfo
}
