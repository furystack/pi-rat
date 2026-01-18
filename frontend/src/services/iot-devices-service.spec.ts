import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { IotDevicesService } from './iot-devices-service.js'
import { IotApiClient } from './api-clients/iot-api-client.js'
import { WebsocketNotificationsService } from './websocket-events.js'
import type { Device, DeviceAwakeHistory, DevicePingHistory } from 'common'

const createMockDevice = (name = 'test-device', ipAddress = '192.168.1.100'): Device => ({
  name,
  ipAddress,
  macAddress: '00:11:22:33:44:55',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

const createMockPingHistory = (name = 'test-device'): DevicePingHistory => ({
  id: 'ping-1',
  name,
  isAvailable: true,
  ping: 10,
  createdAt: new Date().toISOString(),
})

const createMockAwakeHistory = (name = 'test-device'): DeviceAwakeHistory => ({
  id: 'awake-1',
  name,
  success: true,
  createdAt: new Date().toISOString(),
})

describe('IotDevicesService', () => {
  const createTestInjector = (mockCall: ReturnType<typeof vi.fn>) => {
    const injector = new Injector()
    injector.setExplicitInstance(
      {
        call: mockCall,
      } as unknown as IotApiClient,
      IotApiClient,
    )
    // Mock WebsocketNotificationsService to avoid websocket initialization
    injector.setExplicitInstance(
      {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      } as unknown as WebsocketNotificationsService,
      WebsocketNotificationsService,
    )
    return injector
  }

  describe('getDevice', () => {
    it('should fetch a device by name', async () => {
      const mockDevice = createMockDevice()
      const mockCall = vi.fn().mockResolvedValue({ result: mockDevice })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(IotDevicesService)

        const result = await service.getDevice('test-device')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/devices/:id',
          url: { id: 'test-device' },
          query: {},
        })
        expect(result).toEqual(mockDevice)
      })
    })

    it('should cache device results', async () => {
      const mockDevice = createMockDevice()
      const mockCall = vi.fn().mockResolvedValue({ result: mockDevice })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(IotDevicesService)

        await service.getDevice('test-device')
        await service.getDevice('test-device')

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('getDeviceAsObservable', () => {
    it('should return an observable for device', async () => {
      const mockDevice = createMockDevice()
      const mockCall = vi.fn().mockResolvedValue({ result: mockDevice })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(IotDevicesService)

        const observable = service.getDeviceAsObservable('test-device')

        expect(observable).toBeDefined()
        expect(observable.getValue().status).toBe('uninitialized')
      })
    })
  })

  describe('findDevice', () => {
    it('should find devices with query options', async () => {
      const mockDevices = {
        count: 2,
        entries: [createMockDevice('device-1', '192.168.1.100'), createMockDevice('device-2', '192.168.1.101')],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockDevices })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(IotDevicesService)

        const findOptions = { top: 10 }
        const result = await service.findDevice(findOptions)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/devices',
          query: {
            findOptions,
          },
        })
        expect(result).toEqual(mockDevices)
      })
    })

    it('should pre-populate individual device cache from query results', async () => {
      const device1 = createMockDevice('device-1', '192.168.1.100')
      const device2 = createMockDevice('device-2', '192.168.1.101')
      const mockDevices = {
        count: 2,
        entries: [device1, device2],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockDevices })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(IotDevicesService)

        await service.findDevice({ top: 10 })
        const result = await service.getDevice('device-1')

        expect(mockCall).toHaveBeenCalledTimes(1)
        expect(result).toEqual(device1)
      })
    })
  })

  describe('findPingHistory', () => {
    it('should find ping history for a device', async () => {
      const mockPingHistory = {
        count: 1,
        entries: [createMockPingHistory()],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockPingHistory })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(IotDevicesService)

        const result = await service.findPingHistory('test-device', { top: 10 })

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/device-ping-history',
          query: {
            findOptions: {
              top: 10,
              filter: {
                $and: [{ name: { $eq: 'test-device' } }],
              },
            },
          },
        })
        expect(result).toEqual(mockPingHistory)
      })
    })
  })

  describe('findAwakeHistory', () => {
    it('should find awake history for a device', async () => {
      const mockAwakeHistory = {
        count: 1,
        entries: [createMockAwakeHistory()],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockAwakeHistory })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(IotDevicesService)

        const result = await service.findAwakeHistory('test-device', { top: 10 })

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/device-awake-history',
          query: {
            findOptions: {
              top: 10,
              filter: {
                $and: [{ name: { $eq: 'test-device' } }],
              },
            },
          },
        })
        expect(result).toEqual(mockAwakeHistory)
      })
    })
  })

  describe('addDevice', () => {
    it('should add a new device', async () => {
      const newDevice = createMockDevice()
      const mockCall = vi.fn().mockResolvedValue({ result: newDevice })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(IotDevicesService)

        const body = {
          name: 'test-device',
          ipAddress: '192.168.1.100',
          macAddress: '00:11:22:33:44:55',
        }
        const result = await service.addDevice(body)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'POST',
          action: '/devices',
          body,
        })
        expect(result).toEqual({ result: newDevice })
      })
    })
  })

  describe('updateDevice', () => {
    it('should update an existing device', async () => {
      const mockDevice = createMockDevice()
      const mockCall = vi.fn().mockResolvedValue({ result: mockDevice })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(IotDevicesService)

        const body = {
          name: 'test-device',
          ipAddress: '192.168.1.200',
          macAddress: '00:11:22:33:44:55',
        }
        await service.updateDevice('test-device', body)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'PATCH',
          action: '/devices/:id',
          url: { id: 'test-device' },
          body,
        })
      })
    })

    it('should reload device cache after update', async () => {
      const mockDevice = createMockDevice()
      const mockCall = vi.fn().mockResolvedValue({ result: mockDevice })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(IotDevicesService)

        const body = {
          name: 'test-device',
          ipAddress: '192.168.1.200',
          macAddress: '00:11:22:33:44:55',
        }
        await service.updateDevice('test-device', body)

        expect(mockCall).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('deleteDevice', () => {
    it('should delete a device', async () => {
      const mockCall = vi.fn().mockResolvedValue({})
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(IotDevicesService)

        await service.deleteDevice('test-device')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'DELETE',
          action: '/devices/:id',
          url: { id: 'test-device' },
        })
      })
    })
  })

  describe('wakeUpDevice', () => {
    it('should send wake-up request for a device', async () => {
      const mockDevice = createMockDevice()
      const mockCall = vi.fn().mockResolvedValue({})
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(IotDevicesService)

        await service.wakeUpDevice(mockDevice)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'POST',
          action: '/devices/:id/awake',
          url: { id: 'test-device' },
        })
      })
    })
  })

  describe('pingDevice', () => {
    it('should send ping request for a device', async () => {
      const mockDevice = createMockDevice()
      const mockCall = vi.fn().mockResolvedValue({})
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(IotDevicesService)

        await service.pingDevice(mockDevice)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'POST',
          action: '/devices/:id/ping',
          url: { id: 'test-device' },
        })
      })
    })
  })

  describe('observeLastPingForDevice', () => {
    it('should return an observable for the latest ping', async () => {
      const mockDevice = createMockDevice()
      const mockPingHistory = {
        count: 1,
        entries: [createMockPingHistory()],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockPingHistory })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(IotDevicesService)

        const observable = service.observeLastPingForDevice(mockDevice)

        expect(observable).toBeDefined()
        expect(observable.getValue().status).toBe('uninitialized')
      })
    })
  })

  describe('observeLastAwakeEntryForDevice', () => {
    it('should return an observable for the latest awake entry', async () => {
      const mockDevice = createMockDevice()
      const mockAwakeHistory = {
        count: 1,
        entries: [createMockAwakeHistory()],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockAwakeHistory })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(IotDevicesService)

        const observable = service.observeLastAwakeEntryForDevice(mockDevice)

        expect(observable).toBeDefined()
        expect(observable.getValue().status).toBe('uninitialized')
      })
    })
  })
})
