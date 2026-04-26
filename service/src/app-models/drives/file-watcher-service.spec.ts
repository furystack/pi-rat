import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { FileWatcherService } from './file-watcher-service.js'
import { WebsocketService } from '../../websocket-service.js'

const mockLogger = {
  verbose: vi.fn().mockResolvedValue(undefined),
  error: vi.fn().mockResolvedValue(undefined),
  information: vi.fn().mockResolvedValue(undefined),
  warning: vi.fn().mockResolvedValue(undefined),
}

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => mockLogger,
  }),
  useScopedLogger: () => mockLogger,
}))

vi.mock('chokidar', () => ({
  watch: () => ({
    on: vi.fn().mockReturnThis(),
    close: vi.fn().mockResolvedValue(undefined),
  }),
}))

const mockSubscribe = vi.fn().mockReturnValue({ [Symbol.dispose]: vi.fn() })
const mockFind = vi.fn().mockResolvedValue([])

vi.mock('@furystack/repository', () => ({
  defineDataSet: ({ store }: { store: unknown }) => store,
  getDataSetFor: () => ({
    subscribe: mockSubscribe,
    find: mockFind,
  }),
}))

vi.mock('@furystack/core', () => ({
  isAuthorized: () => true,
  useSystemIdentityContext: ({ injector }: { injector: unknown }) => injector,
}))

const buildService = (injector: Injector) => {
  injector.bind(WebsocketService, async () => ({ announce: vi.fn() }))
  return injector.get(FileWatcherService)
}

describe('FileWatcherService', () => {
  it('should log a warning instead of throwing when removing a non-existent watcher', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const service = buildService(injector)

      await (service as unknown as { removeWatcher: (letter: string) => Promise<void> }).removeWatcher('Z')

      expect(mockLogger.warning).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('no watcher exists') as string,
        }),
      )
    })
  })

  it('should close and remove an existing watcher', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const service = buildService(injector)

      const { addWatcher } = service as unknown as {
        addWatcher: (drive: { letter: string; physicalPath: string }) => Promise<void>
      }
      await addWatcher.call(service, { letter: 'T', physicalPath: '/tmp/test' })

      const { removeWatcher } = service as unknown as { removeWatcher: (letter: string) => Promise<void> }
      await removeWatcher.call(service, 'T')

      expect(mockLogger.information).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Stopping File Watcher on volume 'T'") as string,
        }),
      )
    })
  })

  it('should throw when adding a watcher for an already-watched drive', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const service = buildService(injector)

      const { addWatcher } = service as unknown as {
        addWatcher: (drive: { letter: string; physicalPath: string }) => Promise<void>
      }
      await addWatcher.call(service, { letter: 'X', physicalPath: '/tmp/test' })

      await expect(addWatcher.call(service, { letter: 'X', physicalPath: '/tmp/test' })).rejects.toThrow(
        "Watcher for drive 'X' already exists",
      )
    })
  })
})
