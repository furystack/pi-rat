import type { OmdbConfig } from 'common'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createConfigWatcher, type ConfigWatcher } from './config-watcher.js'

const createMockDeps = () => {
  const subscribers: Record<string, Array<(arg: unknown) => void>> = {}

  const configDataSet = {
    get: vi.fn(),
    subscribe: vi.fn((event: string, handler: (arg: unknown) => void) => {
      if (!subscribers[event]) subscribers[event] = []
      subscribers[event].push(handler)
      return { [Symbol.dispose]: vi.fn() }
    }),
  }

  const logger = {
    verbose: vi.fn().mockResolvedValue(undefined),
    information: vi.fn().mockResolvedValue(undefined),
    warning: vi.fn().mockResolvedValue(undefined),
    error: vi.fn().mockResolvedValue(undefined),
  }

  const systemInjector = {} as never

  const emit = (event: string, payload: unknown) => {
    for (const handler of subscribers[event] ?? []) {
      handler(payload)
    }
  }

  return { configDataSet, logger, systemInjector, emit }
}

describe('createConfigWatcher', () => {
  let deps: ReturnType<typeof createMockDeps>
  let onChange: ReturnType<typeof vi.fn<(config: OmdbConfig | undefined) => void>>
  let watcher: ConfigWatcher

  beforeEach(() => {
    deps = createMockDeps()
    onChange = vi.fn<(config: OmdbConfig | undefined) => void>()
    watcher = createConfigWatcher<OmdbConfig>({
      configDataSet: deps.configDataSet as never,
      systemInjector: deps.systemInjector,
      logger: deps.logger as never,
      configId: 'OMDB_CONFIG',
      serviceName: 'Test Service',
      onChange,
    })
  })

  it('should call onChange with config when config exists', async () => {
    deps.configDataSet.get.mockResolvedValue({ id: 'OMDB_CONFIG', value: { apiKey: 'key-1' } })

    await watcher.init()

    expect(onChange).toHaveBeenCalledWith({ id: 'OMDB_CONFIG', value: { apiKey: 'key-1' } })
  })

  it('should call onChange with undefined when config is missing', async () => {
    deps.configDataSet.get.mockResolvedValue(undefined)

    await watcher.init()

    expect(onChange).toHaveBeenCalledWith(undefined)
  })

  it('should subscribe to add/update/remove events', async () => {
    deps.configDataSet.get.mockResolvedValue(undefined)

    await watcher.init()

    expect(deps.configDataSet.subscribe).toHaveBeenCalledWith('onEntityAdded', expect.any(Function))
    expect(deps.configDataSet.subscribe).toHaveBeenCalledWith('onEntityUpdated', expect.any(Function))
    expect(deps.configDataSet.subscribe).toHaveBeenCalledWith('onEntityRemoved', expect.any(Function))
  })

  it('should call onChange when entity is added with matching id', async () => {
    deps.configDataSet.get.mockResolvedValue(undefined)
    await watcher.init()
    onChange.mockClear()

    deps.emit('onEntityAdded', { entity: { id: 'OMDB_CONFIG', value: { apiKey: 'new-key' } } })

    expect(onChange).toHaveBeenCalledWith({ id: 'OMDB_CONFIG', value: { apiKey: 'new-key' } })
  })

  it('should NOT call onChange when entity is added with different id', async () => {
    deps.configDataSet.get.mockResolvedValue(undefined)
    await watcher.init()
    onChange.mockClear()

    deps.emit('onEntityAdded', { entity: { id: 'OTHER_CONFIG', value: {} } })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('should merge partial updates on onEntityUpdated', async () => {
    deps.configDataSet.get.mockResolvedValue({ id: 'OMDB_CONFIG', value: { apiKey: 'key-1' } })
    await watcher.init()
    onChange.mockClear()

    deps.emit('onEntityUpdated', { change: { id: 'OMDB_CONFIG', value: { apiKey: 'key-2' } } })

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'OMDB_CONFIG', value: { apiKey: 'key-2' } }))
  })

  it('should call onChange with undefined on entity removal', async () => {
    deps.configDataSet.get.mockResolvedValue({ id: 'OMDB_CONFIG', value: { apiKey: 'key-1' } })
    await watcher.init()
    onChange.mockClear()

    deps.emit('onEntityRemoved', { key: 'OMDB_CONFIG' })

    expect(onChange).toHaveBeenCalledWith(undefined)
  })

  it('should NOT call onChange on removal of a different config', async () => {
    deps.configDataSet.get.mockResolvedValue({ id: 'OMDB_CONFIG', value: { apiKey: 'key-1' } })
    await watcher.init()
    onChange.mockClear()

    deps.emit('onEntityRemoved', { key: 'OTHER_CONFIG' })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('should dispose old subscriptions when init is called again', async () => {
    deps.configDataSet.get.mockResolvedValue(undefined)

    await watcher.init()

    const disposeSpies = deps.configDataSet.subscribe.mock.results.map(
      (r) => (r.value as { [Symbol.dispose]: ReturnType<typeof vi.fn> })[Symbol.dispose],
    )

    await watcher.init()

    for (const spy of disposeSpies) {
      expect(spy).toHaveBeenCalled()
    }
  })

  it('should dispose subscriptions on dispose()', async () => {
    deps.configDataSet.get.mockResolvedValue(undefined)
    await watcher.init()

    const disposeSpies = deps.configDataSet.subscribe.mock.results.map(
      (r) => (r.value as { [Symbol.dispose]: ReturnType<typeof vi.fn> })[Symbol.dispose],
    )

    watcher.dispose()

    for (const spy of disposeSpies) {
      expect(spy).toHaveBeenCalled()
    }
  })
})
