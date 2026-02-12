import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { LogLevel } from '@furystack/logging'
import { describe, expect, it, vi } from 'vitest'
import { LoggingService } from './logging-service.js'
import { LoggingApiClient } from './api-clients/logging-api-client.js'
import { WebsocketNotificationsService } from './websocket-events.js'
import type { LogEntry } from 'common'

const createMockLogEntry = (id = 'log-1', level: LogLevel = 'information'): LogEntry => ({
  id,
  scope: 'test-scope',
  level,
  message: 'Test log message',
  createdAt: new Date().toISOString(),
})

describe('LoggingService', () => {
  const createTestInjector = (mockCall: ReturnType<typeof vi.fn>) => {
    const injector = new Injector()
    injector.setExplicitInstance(
      {
        call: mockCall,
      } as unknown as LoggingApiClient,
      LoggingApiClient,
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

  describe('getLogEntry', () => {
    it('should fetch a log entry by id', async () => {
      const mockLogEntry = createMockLogEntry()
      const mockCall = vi.fn().mockResolvedValue({ result: mockLogEntry })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(LoggingService)

        const result = await service.getLogEntry('log-1')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/logs/:id',
          url: { id: 'log-1' },
          query: {},
        })
        expect(result).toEqual(mockLogEntry)
      })
    })

    it('should cache log entry results', async () => {
      const mockLogEntry = createMockLogEntry()
      const mockCall = vi.fn().mockResolvedValue({ result: mockLogEntry })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(LoggingService)

        await service.getLogEntry('log-1')
        await service.getLogEntry('log-1')

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('getLogEntryAsObservable', () => {
    it('should return an observable for log entry', async () => {
      const mockLogEntry = createMockLogEntry()
      const mockCall = vi.fn().mockResolvedValue({ result: mockLogEntry })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(LoggingService)

        const observable = service.getLogEntryAsObservable('log-1')

        expect(observable).toBeDefined()
        expect(observable.getValue().status).toBe('loading')
      })
    })

    it('should share the same observable for the same log entry id', async () => {
      const mockLogEntry = createMockLogEntry()
      const mockCall = vi.fn().mockResolvedValue({ result: mockLogEntry })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(LoggingService)

        const observable1 = service.getLogEntryAsObservable('log-1')
        const observable2 = service.getLogEntryAsObservable('log-1')

        expect(observable1).toBe(observable2)
      })
    })
  })

  describe('findLogEntry', () => {
    it('should find log entries with query options', async () => {
      const mockLogEntries = {
        count: 2,
        entries: [createMockLogEntry('log-1', 'information'), createMockLogEntry('log-2', 'error')],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockLogEntries })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(LoggingService)

        const findOptions = { top: 10, order: { createdAt: 'DESC' as const } }
        const result = await service.findLogEntry(findOptions)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/logs',
          query: {
            findOptions,
          },
        })
        expect(result).toEqual(mockLogEntries)
      })
    })

    it('should cache query results', async () => {
      const mockLogEntries = {
        count: 1,
        entries: [createMockLogEntry()],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockLogEntries })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(LoggingService)

        const findOptions = { top: 10 }
        await service.findLogEntry(findOptions)
        await service.findLogEntry(findOptions)

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })

    it('should pre-populate individual log entry cache from query results', async () => {
      const log1 = createMockLogEntry('log-1', 'information')
      const log2 = createMockLogEntry('log-2', 'error')
      const mockLogEntries = {
        count: 2,
        entries: [log1, log2],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockLogEntries })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(LoggingService)

        await service.findLogEntry({ top: 10 })
        const result = await service.getLogEntry('log-1')

        expect(mockCall).toHaveBeenCalledTimes(1)
        expect(result).toEqual(log1)
      })
    })
  })

  describe('findLogEntryAsObservable', () => {
    it('should return an observable for log entry query', async () => {
      const mockLogEntries = {
        count: 1,
        entries: [createMockLogEntry()],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockLogEntries })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(LoggingService)

        const findOptions = { top: 10 }
        const observable = service.findLogEntryAsObservable(findOptions)

        expect(observable).toBeDefined()
        expect(observable.getValue().status).toBe('loading')
      })
    })
  })
})
