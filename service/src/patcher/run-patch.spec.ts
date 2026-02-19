import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Patch } from './patch.js'
import type { PatchRunStore } from './patch-run-store.js'
import { runPatch } from './run-patch.js'

// Mock getLogger
vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      verbose: vi.fn().mockResolvedValue(undefined),
      warning: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

describe('runPatch', () => {
  const createMockStore = () => ({
    find: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
  })

  const createMockPatch = (overrides: Partial<Patch> = {}): Patch => ({
    id: 'test-patch-1',
    name: 'Test Patch',
    description: 'A test patch',
    run: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should skip patch that has already been applied successfully', async () => {
    const mockStore = createMockStore()
    mockStore.find.mockResolvedValue([{ patchId: 'test-patch-1', status: 'success' }])

    const mockPatch = createMockPatch()

    await usingAsync(new Injector(), async (injector) => {
      await runPatch(injector, mockPatch, mockStore as unknown as PatchRunStore)

      expect(mockStore.find).toHaveBeenCalled()
      expect(mockStore.add).not.toHaveBeenCalled()
      expect(mockPatch.run).not.toHaveBeenCalled()
    })
  })

  it('should skip patch that is currently running', async () => {
    const mockStore = createMockStore()
    mockStore.find.mockResolvedValue([{ patchId: 'test-patch-1', status: 'running' }])

    const mockPatch = createMockPatch()

    await usingAsync(new Injector(), async (injector) => {
      await runPatch(injector, mockPatch, mockStore as unknown as PatchRunStore)

      expect(mockStore.add).not.toHaveBeenCalled()
      expect(mockPatch.run).not.toHaveBeenCalled()
    })
  })

  it('should run patch but warn if it previously failed', async () => {
    const mockStore = createMockStore()
    mockStore.find.mockResolvedValue([{ patchId: 'test-patch-1', status: 'failed' }])
    mockStore.add.mockResolvedValue({ created: [{ id: 'run-1', log: [] }] })
    mockStore.update.mockResolvedValue(undefined)

    const mockPatch = createMockPatch()

    await usingAsync(new Injector(), async (injector) => {
      await runPatch(injector, mockPatch, mockStore as unknown as PatchRunStore)

      expect(mockStore.add).toHaveBeenCalled()
      expect(mockPatch.run).toHaveBeenCalled()
    })
  })

  it('should run patch successfully when not previously run', async () => {
    const mockStore = createMockStore()
    mockStore.find.mockResolvedValue([])
    mockStore.add.mockResolvedValue({ created: [{ id: 'run-1', log: [] }] })
    mockStore.update.mockResolvedValue(undefined)

    const mockPatch = createMockPatch()

    await usingAsync(new Injector(), async (injector) => {
      await runPatch(injector, mockPatch, mockStore as unknown as PatchRunStore)

      expect(mockStore.add).toHaveBeenCalledWith(
        injector,
        expect.objectContaining({
          patchId: 'test-patch-1',
          name: 'Test Patch',
          status: 'running',
        }),
      )
      expect(mockPatch.run).toHaveBeenCalled()
      expect(mockStore.update).toHaveBeenCalledWith(
        injector,
        'run-1',
        expect.objectContaining({ status: 'success' }),
      )
    })
  })

  it('should update status to failed when patch throws', async () => {
    const mockStore = createMockStore()
    mockStore.find.mockResolvedValue([])
    mockStore.add.mockResolvedValue({ created: [{ id: 'run-1', log: [] }] })
    mockStore.update.mockResolvedValue(undefined)

    const patchError = new Error('Patch execution failed')
    const mockPatch = createMockPatch({
      run: vi.fn().mockRejectedValue(patchError),
    })

    await usingAsync(new Injector(), async (injector) => {
      await expect(runPatch(injector, mockPatch, mockStore as unknown as PatchRunStore)).rejects.toThrow(
        'Patch execution failed',
      )

      expect(mockStore.update).toHaveBeenCalledWith(
        injector,
        'run-1',
        expect.objectContaining({
          status: 'failed',
          log: expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('Patch failed') })]),
        }),
      )
    })
  })

  it('should log messages during patch execution', async () => {
    const mockStore = createMockStore()
    mockStore.find.mockResolvedValue([])
    const logArray: Array<{ timestamp: string; message: string }> = []
    mockStore.add.mockResolvedValue({ created: [{ id: 'run-1', log: logArray }] })
    mockStore.update.mockResolvedValue(undefined)

    const mockPatch = createMockPatch({
      run: vi.fn().mockImplementation(async (_injector: Injector, log: (message: string) => void) => {
        log('Step 1 completed')
        log('Step 2 completed')
      }),
    })

    await usingAsync(new Injector(), async (injector) => {
      await runPatch(injector, mockPatch, mockStore as unknown as PatchRunStore)

      expect(logArray).toHaveLength(2)
      expect(logArray[0].message).toBe('Step 1 completed')
      expect(logArray[1].message).toBe('Step 2 completed')
    })
  })
})
