import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import type { Drive } from 'common'
import { DrivesService } from './drives-service.js'
import { DrivesApiClient } from './api-clients/drives-api-client.js'
import { WebsocketNotificationsService } from './websocket-events.js'

const createMockDrive = (letter = 'A', physicalPath = '/mnt/drive-a'): Drive => ({
  letter,
  physicalPath,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

describe('DrivesService', () => {
  const createTestInjector = (mockCall: ReturnType<typeof vi.fn>) => {
    const injector = new Injector()
    injector.setExplicitInstance(
      {
        call: mockCall,
      } as unknown as DrivesApiClient,
      DrivesApiClient,
    )
    injector.setExplicitInstance(
      {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      } as unknown as WebsocketNotificationsService,
      WebsocketNotificationsService,
    )
    return injector
  }

  describe('getVolumes', () => {
    it('should fetch volumes with find options', async () => {
      const mockResult = { count: 1, entries: [createMockDrive()] }
      const mockCall = vi.fn().mockResolvedValue({ result: mockResult })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DrivesService)
        const findOptions = { top: 10 }

        const result = await service.getVolumes({ findOptions })

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/volumes',
          query: { findOptions },
        })
        expect(result).toEqual(mockResult)
      })
    })

    it('should cache volume results', async () => {
      const mockResult = { count: 1, entries: [createMockDrive()] }
      const mockCall = vi.fn().mockResolvedValue({ result: mockResult })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DrivesService)
        const findOptions = { top: 10 }

        await service.getVolumes({ findOptions })
        await service.getVolumes({ findOptions })

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('getVolumesAsObservable', () => {
    it('should return an observable for volumes', async () => {
      const mockResult = { count: 1, entries: [createMockDrive()] }
      const mockCall = vi.fn().mockResolvedValue({ result: mockResult })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DrivesService)

        const observable = service.getVolumesAsObservable({ findOptions: {} })

        expect(observable).toBeDefined()
        expect(observable.getValue().status).toBe('loading')
      })
    })
  })

  describe('getVolume', () => {
    it('should fetch a single volume by id', async () => {
      const mockDrive = createMockDrive('A')
      const mockCall = vi.fn().mockResolvedValue({ result: mockDrive })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DrivesService)

        const result = await service.getVolume('A')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/volumes/:id',
          url: { id: 'A' },
          query: {},
        })
        expect(result).toEqual(mockDrive)
      })
    })

    it('should cache single volume results', async () => {
      const mockDrive = createMockDrive('A')
      const mockCall = vi.fn().mockResolvedValue({ result: mockDrive })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DrivesService)

        await service.getVolume('A')
        await service.getVolume('A')

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('getVolumeAsObservable', () => {
    it('should return an observable for a single volume', async () => {
      const mockDrive = createMockDrive('A')
      const mockCall = vi.fn().mockResolvedValue({ result: mockDrive })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DrivesService)

        const observable = service.getVolumeAsObservable('A')

        expect(observable).toBeDefined()
        expect(observable.getValue().status).toBe('loading')
      })
    })
  })

  describe('addVolume', () => {
    it('should create a new volume and obsolete volumes cache', async () => {
      const newDrive = createMockDrive('B', '/mnt/drive-b')
      const mockCall = vi.fn().mockResolvedValue({ result: newDrive })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DrivesService)

        const body = { physicalPath: '/mnt/drive-b' }
        const result = await service.addVolume(body)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'POST',
          action: '/volumes',
          body,
        })
        expect(result).toEqual({ result: newDrive })
      })
    })

    it('should invalidate volumes cache after adding', async () => {
      const mockResult = { count: 1, entries: [createMockDrive()] }
      const newDrive = createMockDrive('B')
      const mockCall = vi
        .fn()
        .mockResolvedValueOnce({ result: mockResult })
        .mockResolvedValueOnce({ result: newDrive })
        .mockResolvedValueOnce({ result: { count: 2, entries: [createMockDrive(), newDrive] } })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DrivesService)

        await service.getVolumes({ findOptions: {} })
        await service.addVolume({ physicalPath: '/mnt/drive-b' })
        await service.getVolumes({ findOptions: {} })

        expect(mockCall).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('updateVolume', () => {
    it('should update a volume and obsolete caches', async () => {
      const mockCall = vi.fn().mockResolvedValue({ result: undefined })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DrivesService)

        const body = { physicalPath: '/mnt/drive-a-updated' }
        await service.updateVolume('A', body)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'PATCH',
          action: '/volumes/:id',
          url: { id: 'A' },
          body,
        })
      })
    })

    it('should invalidate volumes cache after updating', async () => {
      const mockResult = { count: 1, entries: [createMockDrive()] }
      const mockCall = vi
        .fn()
        .mockResolvedValueOnce({ result: mockResult })
        .mockResolvedValueOnce({ result: undefined })
        .mockResolvedValueOnce({ result: mockResult })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DrivesService)

        await service.getVolumes({ findOptions: {} })
        await service.updateVolume('A', { physicalPath: '/updated' })
        await service.getVolumes({ findOptions: {} })

        expect(mockCall).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('removeVolume', () => {
    it('should delete a volume', async () => {
      const mockCall = vi.fn().mockResolvedValue({})
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DrivesService)

        await service.removeVolume('A')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'DELETE',
          action: '/volumes/:id',
          url: { id: 'A' },
        })
      })
    })

    it('should flush volumes cache after removing', async () => {
      const mockResult = { count: 1, entries: [createMockDrive()] }
      const mockCall = vi
        .fn()
        .mockResolvedValueOnce({ result: mockResult })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ result: { count: 0, entries: [] } })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DrivesService)

        await service.getVolumes({ findOptions: {} })
        await service.removeVolume('A')
        await service.getVolumes({ findOptions: {} })

        expect(mockCall).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('getFileList', () => {
    it('should fetch a file list for a drive and path', async () => {
      const mockEntries = {
        entries: [
          { name: 'folder', isFile: false, isDirectory: true },
          { name: 'file.txt', isFile: true, isDirectory: false },
        ],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockEntries })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DrivesService)

        const result = await service.getFileList('A', '/')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/files/:letter/:path',
          url: { letter: 'A', path: '/' },
        })
        expect(result.letter).toBe('A')
        expect(result.path).toBe('/')
      })
    })

    it('should sort entries with directories first', async () => {
      const mockEntries = {
        entries: [
          { name: 'zebra.txt', isFile: true, isDirectory: false },
          { name: 'alpha-dir', isFile: false, isDirectory: true },
          { name: 'beta.txt', isFile: true, isDirectory: false },
        ],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockEntries })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DrivesService)

        const result = await service.getFileList('A', '/')

        expect(result.entries[0].name).toBe('alpha-dir')
        expect(result.entries[1].name).toBe('beta.txt')
        expect(result.entries[2].name).toBe('zebra.txt')
      })
    })

    it('should cache file list results', async () => {
      const mockEntries = { entries: [] }
      const mockCall = vi.fn().mockResolvedValue({ result: mockEntries })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DrivesService)

        await service.getFileList('A', '/')
        await service.getFileList('A', '/')

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('removeFile', () => {
    it('should delete a file', async () => {
      const mockCall = vi.fn().mockResolvedValue({})
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(DrivesService)

        await service.removeFile({ letter: 'A', path: '/test.txt' })

        expect(mockCall).toHaveBeenCalledWith({
          method: 'DELETE',
          action: '/files/:letter/:path',
          url: { letter: 'A', path: '/test.txt' },
        })
      })
    })
  })
})
