import { useSystemIdentityContext } from '@furystack/core'
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

export type DeviceAvailabilityHub = EventHub<DeviceAvailabilityEvents>

export const DeviceAvailabilityHub: Token<DeviceAvailabilityHub, 'singleton'> = defineService({
  name: 'pi-rat/DeviceAvailabilityHub',
  lifetime: 'singleton',
  factory: (ctx) => {
    const { injector, onDispose } = ctx
    const logger = useScopedLogger(ctx)
    const systemInjector = useSystemIdentityContext({ injector, username: 'device-availability' })

    const hub = new EventHub<DeviceAvailabilityEvents>()
    let devices: Device[] = []
    const deviceStatusMap = new Map<string, boolean>()
    let stopped = false

    const updateDevices = (next: Device[]): void => {
      devices = [...next]
    }

    const getCurrentConfig = async (): Promise<IotConfig> => {
      try {
        const configDataSet = getDataSetFor(systemInjector, ConfigDataSet)
        const loaded = (await configDataSet.get(systemInjector, 'IOT_CONFIG')) as IotConfig | undefined
        return loaded || defaultIotConfig
      } catch (error) {
        await logger.warning({
          message: 'Error while loading IOT_CONFIG, falling back to defaults',
          data: { error },
        })
        return defaultIotConfig
      }
    }

    const refreshConnections = async (): Promise<void> => {
      hub.emit('refresh', null)
      const currentConfig = await getCurrentConfig()
      const pingHistoryDataSet = getDataSetFor(systemInjector, DevicePingHistoryDataSet)

      try {
        await Promise.all(
          devices
            .filter((device) => device.ipAddress)
            .map(async (device) => {
              const lastStatus = deviceStatusMap.get(device.name)
              const { alive: newStatus, avg } = await ping.promise.probe(device.ipAddress!, {
                timeout: currentConfig.value.pingTimeoutMs,
              })

              if (lastStatus !== newStatus) {
                await pingHistoryDataSet.add(systemInjector, {
                  name: device.name,
                  isAvailable: newStatus,
                  ping: parseFloat(avg) || undefined,
                  createdAt: new Date().toISOString(),
                })
                deviceStatusMap.set(device.name, newStatus)
                hub.emit(newStatus ? 'connected' : 'disconnected', device)
                await logger.verbose({
                  message: `Device ${device.name} is ${newStatus ? 'connected' : 'disconnected'}`,
                })
              }
            }),
        )
      } catch (error) {
        await logger.warning({
          message: `Error while refreshing device connections: ${(error as Error)?.toString()}`,
          data: { error },
        })
      } finally {
        if (!stopped) {
          const sleepMs = currentConfig.value.pingIntervalMs || 30 * 1000
          await sleepAsync(sleepMs)
          if (!stopped) {
            void refreshConnections()
          }
        }
      }
    }

    const start = async () => {
      const deviceDataSet = getDataSetFor(systemInjector, DeviceDataSet)
      const currentDevices = await deviceDataSet.find(systemInjector, {})
      updateDevices(currentDevices)

      deviceDataSet.subscribe('onEntityAdded', ({ entity }) => {
        updateDevices([...devices, entity])
      })
      deviceDataSet.subscribe('onEntityRemoved', ({ key }) => {
        updateDevices(devices.filter((device) => device.name !== key))
      })
      deviceDataSet.subscribe('onEntityUpdated', ({ id, change }) => {
        updateDevices(devices.map((device) => (device.name === id ? { ...device, ...change } : device)))
      })
      await refreshConnections()
    }

    void start().catch((error) => {
      void logger.error({ message: 'Failed to start DeviceAvailabilityHub', data: { error } })
    })

    onDispose(() => {
      stopped = true
    })
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to caller
    onDispose(() => hub[Symbol.dispose]())
    onDispose(() => systemInjector[Symbol.asyncDispose]())

    return hub
  },
})
