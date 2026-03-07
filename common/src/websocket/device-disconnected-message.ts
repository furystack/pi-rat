export interface DeviceDisconnectedMessage {
  type: 'device-disconnected'
  device: { name: string; ipAddress?: string; macAddress?: string }
}
