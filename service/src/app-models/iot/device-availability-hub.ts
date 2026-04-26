import { useSystemIdentityContext } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { defineService, type Token } from '@furystack/inject'
import { useScopedLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { EventHub, sleepAsync } from '@furystack/utils'
import { type Device, type IotConfig } from 'common'
import ping from 'ping'
import { ConfigDataSet } from '../config/setup-config-store.js'
import { DeviceDataSet, DevicePingHistoryDataSet } from './setup-store.js'

const defaultIotConfig: IotConfig = {
  id: 'IOT_CONFIG',
  value: {
    pingIntervalMs: 30 * 1000,
    pingTimeoutMs: 3000,
  },
}

type DeviceAvailabilityEvents = { connected: Device; disconnected: Device; refresh: null }

export interface DeviceAvailabilityHub extends EventHub<DeviceAvailabilityEvents> {
  init(): Promise<void>
}

class DeviceAvailabilityHubImpl extends EventHub<DeviceAvailabilityEvents> {
  private devices: Device[] = []
  private deviceStatusMap = new Map<string, boolean>()
  private stopped = false

  constructor(
    private readonly systemInjector: Injector,
    private readonly logger: ReturnType<typeof useScopedLogger>,
  ) {
    super()
  }

  public stop(): void {
    this.stopped = true
  }

  private updateDevices(next: Device[]): void {
    this.devices = [...next]
  }

  private async getCurrentConfig(): Promise<IotConfig> {
    try {
      const configDataSet = getDataSetFor(this.systemInjector, ConfigDataSet)
      const loaded = (await configDataSet.get(this.systemInjector, 'IOT_CONFIG')) as IotConfig | undefined
      return loaded || defaultIotConfig
    } catch (error) {
      await this.logger.warning({
        message: 'Error while loading IOT_CONFIG, falling back to defaults',
        data: { error },
      })
      return defaultIotConfig
    }
  }

  private async refreshConnections(): Promise<void> {
    this.emit('refresh', null)
    const currentConfig = await this.getCurrentConfig()
    const pingHistoryDataSet = getDataSetFor(this.systemInjector, DevicePingHistoryDataSet)

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
              await pingHistoryDataSet.add(this.systemInjector, {
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
        message: `Error while refreshing device connections: ${(error as Error)?.toString()}`,
        data: { error },
      })
    } finally {
      if (!this.stopped) {
        const sleepMs = currentConfig.value.pingIntervalMs || 30 * 1000
        await sleepAsync(sleepMs)
        if (!this.stopped) {
          void this.refreshConnections()
        }
      }
    }
  }

  public async init(): Promise<void> {
    const deviceDataSet = getDataSetFor(this.systemInjector, DeviceDataSet)
    const currentDevices = await deviceDataSet.find(this.systemInjector, {})
    this.updateDevices(currentDevices)

    deviceDataSet.subscribe('onEntityAdded', ({ entity }) => {
      this.updateDevices([...this.devices, entity])
    })
    deviceDataSet.subscribe('onEntityRemoved', ({ key }) => {
      this.updateDevices(this.devices.filter((device) => device.name !== key))
    })
    deviceDataSet.subscribe('onEntityUpdated', ({ id, change }) => {
      this.updateDevices(this.devices.map((device) => (device.name === id ? { ...device, ...change } : device)))
    })
    await this.refreshConnections()
  }
}

export const DeviceAvailabilityHub: Token<DeviceAvailabilityHub, 'singleton'> = defineService({
  name: 'pi-rat/DeviceAvailabilityHub',
  lifetime: 'singleton',
  factory: (ctx) => {
    const { injector, onDispose } = ctx
    const logger = useScopedLogger(ctx)
    const systemInjector = useSystemIdentityContext({ injector, username: 'device-availability' })
    const impl = new DeviceAvailabilityHubImpl(systemInjector, logger)
    onDispose(() => impl.stop())
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
    onDispose(() => impl[Symbol.dispose]())
    onDispose(() => systemInjector[Symbol.asyncDispose]())
    return impl
  },
})
