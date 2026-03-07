import { useSystemIdentityContext } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { getDataSetFor, type DataSet } from '@furystack/repository'
import { EventHub, sleepAsync } from '@furystack/utils'
import { Device, DevicePingHistory } from '@pi-rat/iot-common'
import { Config, type IotConfig } from 'common'
import ping from 'ping'

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
  declare private logger: ScopedLogger

  @Injected((injector) => getDataSetFor(injector, Config, 'id'))
  declare private configDataSet: DataSet<Config, 'id'>

  @Injected((injector) => useSystemIdentityContext({ injector, username: 'device-availability' }))
  declare private systemInjector: Injector

  private getCurrentConfig = async () => {
    try {
      const loaded = (await this.configDataSet.get(this.systemInjector, 'IOT_CONFIG')) as IotConfig
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
              await this.devicePingHistoryDataSet.add(this.systemInjector, {
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
      // await this.logger.verbose({ message: `Device refresh done, sleeping for ${sleepMs}ms` })
      await sleepAsync(sleepMs)
      await this.refreshConnections()
    }
  }

  @Injected((injector) => getDataSetFor(injector, Device, 'name'))
  declare private deviceDataSet: DataSet<Device, 'name'>

  @Injected((injector) => getDataSetFor(injector, DevicePingHistory, 'id'))
  declare private devicePingHistoryDataSet: DataSet<DevicePingHistory, 'id'>

  public async init() {
    const currentDevices = await this.deviceDataSet.find(this.systemInjector, {})
    this.updateDevices(currentDevices)

    this.deviceDataSet.subscribe('onEntityAdded', ({ entity }) => {
      this.updateDevices([...this.devices, entity])
    })
    this.deviceDataSet.subscribe('onEntityRemoved', ({ key }) => {
      this.updateDevices(this.devices.filter((device) => device.name !== key))
    })
    this.deviceDataSet.subscribe('onEntityUpdated', ({ id, change }) => {
      this.updateDevices(this.devices.map((device) => (device.name === id ? { ...device, ...change } : device)))
    })
    await this.refreshConnections()
  }
}
