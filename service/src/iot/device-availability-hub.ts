import type { PhysicalStore, WithOptionalId } from '@furystack/core'
import { StoreManager } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { EventHub, sleepAsync } from '@furystack/utils'
import { Config, Device, DevicePingHistory } from 'common'
import ping from 'ping'
import type { IotConfig } from '../../../common/src/models/config/iot-config.js'

const defaultIotConfig: IotConfig = {
  id: 'IOT_CONFIG',
  value: {
    pingIntervalMs: 30 * 1000,
    pingTimeoutMs: 3000,
  },
}

@Injectable({ lifetime: 'singleton' })
export class DeviceAvailabilityHub extends EventHub<{ connected: Device; disconnected: Device; refresh: null }> {
  private devices: Device[] = []
  public updateDevices = (devices: Device[]) => {
    this.devices = [...devices]
  }
  private deviceStatusMap = new Map<string, boolean>()

  @Injected((injector) => getLogger(injector).withScope('DeviceAvailabilityHub'))
  private declare logger: ScopedLogger

  @Injected((injector) => injector.getInstance(StoreManager).getStoreFor(Config, 'id'))
  private declare configStore: PhysicalStore<Config, 'id', WithOptionalId<Config, 'id'>>

  private getCurrentConfig = async () => {
    try {
      const loaded = (await this.configStore.get('IOT_CONFIG')) as IotConfig
      return loaded || defaultIotConfig
    } catch (error) {
      await this.logger.warning({
        message: 'Error while loading IOT_CONFIG, falling back to defaults',
        data: { error },
      })
      return defaultIotConfig
    }
  }

  private async refreshConnections() {
    this.emit('refresh', null)
    const currentConfig = await this.getCurrentConfig()

    try {
      await Promise.all(
        this.devices
          .filter((device) => device.ipAddress)
          .map(async (device) => {
            const lastStatus = this.deviceStatusMap.get(device.name)
            const { alive: newStatus, avg } = await ping.promise.probe(device.ipAddress!, {
              timeout: currentConfig.value.pingTimeoutMs,
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
              await this.logger.verbose({
                message: `Device ${device.name} is ${newStatus ? 'connected' : 'disconnected'}`,
              })
            }
          }),
      )
    } catch (error) {
      await this.logger.warning({
        message: `Error while refreshing device connections: ${error?.toString()}`,
        data: { error },
      })
    } finally {
      const sleepMs = currentConfig.value.pingIntervalMs || 30 * 1000
      await this.logger.verbose({ message: `Device refresh done, sleeping for ${sleepMs}ms` })
      await sleepAsync(sleepMs)
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
    await this.refreshConnections()
  }
}
