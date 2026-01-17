import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PatchRunStore } from './patch-run-store.js'
import { checkForOrphanedPatch } from './check-for-orphaned-patch.js'

// Mock getLogger
vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      warning: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

describe('checkForOrphanedPatch', () => {
  const createMockStore = () => ({
    find: vi.fn(),
    update: vi.fn(),
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should do nothing when no patches are in running state', async () => {
    const mockStore = createMockStore()
    mockStore.find.mockResolvedValue([])

    await usingAsync(new Injector(), async (injector) => {
      await checkForOrphanedPatch(injector, mockStore as unknown as PatchRunStore)

      expect(mockStore.find).toHaveBeenCalledWith({
        filter: { status: { $eq: 'running' } },
      })
      expect(mockStore.update).not.toHaveBeenCalled()
    })
  })

  it('should set single running patch to orphaned', async () => {
    const mockStore = createMockStore()
    mockStore.find.mockResolvedValue([
      { id: 'patch-run-1', patchId: 'test-patch', status: 'running', log: [] },
    ])
    mockStore.update.mockResolvedValue(undefined)

    await usingAsync(new Injector(), async (injector) => {
      await checkForOrphanedPatch(injector, mockStore as unknown as PatchRunStore)

      expect(mockStore.update).toHaveBeenCalledWith(
        'patch-run-1',
        expect.objectContaining({
          status: 'orphaned',
          log: expect.arrayContaining([
            expect.objectContaining({
              message: expect.stringContaining('Found in running state'),
            }),
          ]),
        }),
      )
    })
  })

  it('should set multiple running patches to orphaned', async () => {
    const mockStore = createMockStore()
    mockStore.find.mockResolvedValue([
      { id: 'patch-run-1', patchId: 'test-patch-1', status: 'running', log: [] },
      { id: 'patch-run-2', patchId: 'test-patch-2', status: 'running', log: [{ timestamp: '2024-01-01', message: 'Started' }] },
    ])
    mockStore.update.mockResolvedValue(undefined)

    await usingAsync(new Injector(), async (injector) => {
      await checkForOrphanedPatch(injector, mockStore as unknown as PatchRunStore)

      expect(mockStore.update).toHaveBeenCalledTimes(2)
      expect(mockStore.update).toHaveBeenCalledWith('patch-run-1', expect.objectContaining({ status: 'orphaned' }))
      expect(mockStore.update).toHaveBeenCalledWith('patch-run-2', expect.objectContaining({ status: 'orphaned' }))
    })
  })

  it('should preserve existing log entries when setting to orphaned', async () => {
    const existingLogs = [
      { timestamp: '2024-01-01T00:00:00Z', message: 'Starting patch' },
      { timestamp: '2024-01-01T00:00:01Z', message: 'Processing...' },
    ]
    const mockStore = createMockStore()
    mockStore.find.mockResolvedValue([
      { id: 'patch-run-1', patchId: 'test-patch', status: 'running', log: existingLogs },
    ])
    mockStore.update.mockResolvedValue(undefined)

    await usingAsync(new Injector(), async (injector) => {
      await checkForOrphanedPatch(injector, mockStore as unknown as PatchRunStore)

      expect(mockStore.update).toHaveBeenCalledWith(
        'patch-run-1',
        expect.objectContaining({
          log: expect.arrayContaining([
            existingLogs[0],
            existingLogs[1],
            expect.objectContaining({ message: expect.stringContaining('Orphaned') }),
          ]),
        }),
      )
    })
  })
})
