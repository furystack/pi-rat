import type { PhysicalStore, WithOptionalId } from '@furystack/core'
import { StoreManager } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { EventHub, sleepAsync } from '@furystack/utils'
import { Device, DevicePingHistory } from 'common'
import ping from 'ping'

@Injectable({ lifetime: 'singleton' })
export class DeviceAvailabilityHub extends EventHub<{ connected: Device; disconnected: Device; refresh: null }> {
  private devices: Device[] = []
  public updateDevices = (devices: Device[]) => {
    this.devices = [...devices]
  }

  private deviceStatusMap = new Map<string, boolean>()

  @Injected((injector) => getLogger(injector).withScope('DeviceAvailabilityHub'))
  private declare logger: ScopedLogger

  private async refreshConnections() {
    this.emit('refresh', null)
    try {
      await this.devices
        .filter((device) => device.ipAddress)
        .map(async (device) => {
          const lastStatus = this.deviceStatusMap.get(device.name)
          const { alive: newStatus, avg } = await ping.promise.probe(device.ipAddress!, {
            timeout: 1,
          })

          if (lastStatus !== newStatus) {
            await this.devicePingHistoryStore.add({
              name: device.name,
              isAvailable: newStatus,
              ping: parseFloat(avg) || undefined,
              createdAt: new Date().toISOString(),
            })
            this.deviceStatusMap.set(device.name, newStatus)
            this.emit(newStatus ? 'connected' : 'disconnected', device)
            this.logger.verbose({ message: `Device ${device.name} is ${newStatus ? 'connected' : 'disconnected'}` })
          }
        })
    } catch (error) {
      await this.logger.warning({
        message: `Error while refreshing device connections: ${error?.toString()}`,
        data: { error },
      })
    } finally {
      await sleepAsync(3000)
      await this.refreshConnections()
    }
  }

  @Injected((injector) => injector.getInstance(StoreManager).getStoreFor(Device, 'name'))
  private declare deviceStore: PhysicalStore<Device, 'name', WithOptionalId<Device, 'name'>>

  @Injected((injector) => injector.getInstance(StoreManager).getStoreFor(DevicePingHistory, 'id'))
  private declare devicePingHistoryStore: PhysicalStore<
    DevicePingHistory,
    'id',
    WithOptionalId<DevicePingHistory, 'id'>
  >

  public async init() {
    const currentDevices = await this.deviceStore.find({})
    this.updateDevices(currentDevices)

    this.deviceStore.subscribe('onEntityAdded', ({ entity }) => {
      this.updateDevices([...this.devices, entity])
    })
    this.deviceStore.subscribe('onEntityRemoved', ({ key }) => {
      this.updateDevices(this.devices.filter((device) => device.name !== key))
    })
    this.deviceStore.subscribe('onEntityUpdated', ({ id, change }) => {
      this.updateDevices(this.devices.map((device) => (device.name === id ? { ...device, ...change } : device)))
    })
  }

  constructor() {
    super()
    this.refreshConnections()
  }
}
