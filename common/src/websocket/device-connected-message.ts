export interface DeviceConnectedMessage {
  type: 'device-connected'
  device: { name: string; ipAddress?: string; macAddress?: string }
}
