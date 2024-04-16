import { StoreManager } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { Injectable } from '@furystack/inject'
import { EventHub, sleepAsync } from '@furystack/utils'
import { Device } from 'common'
import ping from 'ping'

@Injectable({ lifetime: 'singleton' })
export class DeviceAvailabilityHub extends EventHub<{ connected: Device; disconnected: Device }> {
  private devices: Device[] = []
  public updateDevices = (devices: Device[]) => {
    this.devices = [...devices]
  }

  private deviceStatusMap = new Map<string, boolean>()

  private async refreshConnections() {
    try {
      await this.devices
        .filter((device) => device.ipAddress)
        .map(async (device) => {
          const lastStatus = this.deviceStatusMap.get(device.name)
          const { alive: newStatus } = await ping.promise.probe(device.ipAddress!, {
            timeout: 1,
          })

          if (lastStatus !== newStatus) {
            this.deviceStatusMap.set(device.name, newStatus)
            this.emit(newStatus ? 'connected' : 'disconnected', device)
          }
        })
    } finally {
      await sleepAsync(1000)
      await this.refreshConnections()
    }
  }

  public async init(injector: Injector) {
    const deviceStore = injector.getInstance(StoreManager).getStoreFor(Device, 'name')
    const currentDevices = await deviceStore.find({})
    this.updateDevices(currentDevices)

    deviceStore.subscribe('onEntityAdded', ({ entity }) => {
      this.updateDevices([...this.devices, entity])
    })
    deviceStore.subscribe('onEntityRemoved', ({ key }) => {
      this.updateDevices(this.devices.filter((device) => device.name !== key))
    })
    deviceStore.subscribe('onEntityUpdated', ({ id, change }) => {
      this.updateDevices(this.devices.map((device) => (device.name === id ? { ...device, ...change } : device)))
    })
  }

  constructor() {
    super()
    this.refreshConnections()
  }
}
