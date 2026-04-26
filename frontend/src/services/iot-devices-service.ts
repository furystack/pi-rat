import { Cache } from '@furystack/cache'
import type { FindOptions } from '@furystack/core'
import { defineService, type Token } from '@furystack/inject'
import type { Device, DeviceAwakeHistory, DevicePingHistory } from 'common'
import { IotApiClient } from './api-clients/iot-api-client.js'
import { WebsocketNotificationsService } from './websocket-events.js'

const createIotDevicesService = (
  iotApiClient: IotApiClient,
  websocketNotificationsService: WebsocketNotificationsService,
) => {
  const deviceCache = new Cache({
    capacity: 100,
    load: async (id: string) => {
      const { result } = await iotApiClient.call({
        method: 'GET',
        action: '/devices/:id',
        url: { id },
        query: {},
      })
      return result
    },
  })

  const deviceQueryCache = new Cache({
    capacity: 100,
    load: async (findOptions: FindOptions<Device, Array<keyof Device>>) => {
      const { result } = await iotApiClient.call({
        method: 'GET',
        action: '/devices',
        query: { findOptions },
      })

      result.entries.forEach((entry) => {
        deviceCache.setExplicitValue({
          loadArgs: [entry.name],
          value: { status: 'loaded', value: entry, updatedAt: new Date() },
        })
      })

      return result
    },
  })

  const deviceAwakeHistoryCache = new Cache({
    capacity: 100,
    load: async (name: string, query?: FindOptions<DeviceAwakeHistory, Array<keyof DeviceAwakeHistory>>) => {
      const { result } = await iotApiClient.call({
        method: 'GET',
        action: '/device-awake-history',
        query: {
          findOptions: {
            ...query,
            filter: {
              $and: [{ name: { $eq: name } }, ...(query?.filter ? [query.filter] : [])],
            },
          },
        },
      })
      return result
    },
  })

  const devicePingHistoryCache = new Cache({
    capacity: 100,
    load: async (deviceName: string, query?: FindOptions<DevicePingHistory, Array<keyof DevicePingHistory>>) => {
      const { result } = await iotApiClient.call({
        method: 'GET',
        action: '/device-ping-history',
        query: {
          findOptions: {
            ...query,
            filter: {
              $and: [...(query?.filter ? [query.filter] : []), { name: { $eq: deviceName } }],
            },
          },
        },
      })
      return result
    },
  })

  const findPingHistory = devicePingHistoryCache.get.bind(devicePingHistoryCache)
  const findPingHistoryAsObservable = devicePingHistoryCache.getObservable.bind(devicePingHistoryCache)
  const findAwakeHistory = deviceAwakeHistoryCache.get.bind(deviceAwakeHistoryCache)
  const findAwakeHistoryAsObservable = deviceAwakeHistoryCache.getObservable.bind(deviceAwakeHistoryCache)

  const deleteDevice = async (name: string) => {
    await iotApiClient.call({
      method: 'DELETE',
      action: '/devices/:id',
      url: { id: name },
    })
    deviceCache.remove(name)
    deviceQueryCache.flushAll()
    deviceAwakeHistoryCache.flushAll()
    devicePingHistoryCache.flushAll()
  }

  const updateDevice = async (name: string, body: Pick<Device, 'ipAddress' | 'macAddress' | 'name'>) => {
    await iotApiClient.call({
      method: 'PATCH',
      action: '/devices/:id',
      url: { id: name },
      body,
    })

    await deviceCache.reload(name)
    deviceQueryCache.flushAll()
    deviceAwakeHistoryCache.flushAll()
    devicePingHistoryCache.flushAll()
  }

  const addDevice = async (body: Omit<Device, 'createdAt' | 'updatedAt'>) => {
    const result = await iotApiClient.call({
      method: 'POST',
      action: '/devices',
      body,
    })
    deviceQueryCache.flushAll()
    return result
  }

  const wakeUpDevice = async (device: Device) => {
    await iotApiClient.call({
      method: 'POST',
      action: '/devices/:id/awake',
      url: { id: device.name },
    })
    deviceAwakeHistoryCache.obsoleteRange((_, args) => args[0] === device.name)
    devicePingHistoryCache.obsoleteRange((_, args) => args[0] === device.name)
  }

  const pingDevice = async (device: Device) => {
    deviceAwakeHistoryCache.obsoleteRange((_, args) => args[0] === device.name)
    devicePingHistoryCache.obsoleteRange((_, args) => args[0] === device.name)

    await iotApiClient.call({
      method: 'POST',
      action: '/devices/:id/ping',
      url: { id: device.name },
    })
  }

  const observeLastPingForDevice = (device: Device) =>
    findPingHistoryAsObservable(device.name, { top: 1, order: { createdAt: 'DESC' } })

  const reloadLastPingForDevice = (device: Device) =>
    devicePingHistoryCache.reload(device.name, { top: 1, order: { createdAt: 'DESC' } })

  const observeLastAwakeEntryForDevice = (device: Device) =>
    findAwakeHistoryAsObservable(device.name, { top: 1, order: { createdAt: 'DESC' } })

  const reloadLastAwakeEntryForDevice = (device: Device) =>
    deviceAwakeHistoryCache.reload(device.name, { top: 1, order: { createdAt: 'DESC' } })

  websocketNotificationsService.addListener('onMessage', (message) => {
    if (message.type === 'device-connected' || message.type === 'device-disconnected') {
      void deviceCache.reload(message.device.name).catch((error) => {
        console.error('Failed to reload device cache:', error)
      })
      deviceAwakeHistoryCache.obsoleteRange((v) => v.entries.some((e) => e.name === message.device.name))
      devicePingHistoryCache.obsoleteRange((v) => v.entries.some((e) => e.name === message.device.name))
      void devicePingHistoryCache
        .reload(message.device.name, { top: 1, order: { createdAt: 'DESC' } })
        .catch((error) => {
          console.error('Failed to reload device ping history cache:', error)
        })
    }
  })

  const dispose = (): void => {
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to caller
    deviceCache[Symbol.dispose]()
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to caller
    deviceQueryCache[Symbol.dispose]()
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to caller
    deviceAwakeHistoryCache[Symbol.dispose]()
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to caller
    devicePingHistoryCache[Symbol.dispose]()
  }

  return {
    deviceCache,
    devicePingHistoryCache,
    getDevice: deviceCache.get.bind(deviceCache),
    getDeviceAsObservable: deviceCache.getObservable.bind(deviceCache),
    findDevice: deviceQueryCache.get.bind(deviceQueryCache),
    findDeviceAsObservable: deviceQueryCache.getObservable.bind(deviceQueryCache),
    findPingHistory,
    findPingHistoryAsObservable,
    findAwakeHistory,
    findAwakeHistoryAsObservable,
    deleteDevice,
    updateDevice,
    addDevice,
    wakeUpDevice,
    pingDevice,
    observeLastPingForDevice,
    reloadLastPingForDevice,
    observeLastAwakeEntryForDevice,
    reloadLastAwakeEntryForDevice,
    [Symbol.dispose]: dispose,
  }
}

export type IotDevicesService = ReturnType<typeof createIotDevicesService>

export const IotDevicesService: Token<IotDevicesService, 'singleton'> = defineService({
  name: 'pi-rat/IotDevicesService',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }) => {
    const impl = createIotDevicesService(inject(IotApiClient), inject(WebsocketNotificationsService))
    onDispose(() => impl[Symbol.dispose]())
    return impl
  },
})
