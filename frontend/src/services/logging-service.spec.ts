import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { LogLevel } from '@furystack/logging'
import { describe, expect, it, vi } from 'vitest'
import { LoggingService } from './logging-service.js'
import { LoggingApiClient } from './api-clients/logging-api-client.js'
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

    it('should call the API for each request', async () => {
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

        expect(mockCall).toHaveBeenCalledTimes(2)
      })
    })
  })
})
