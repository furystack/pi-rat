import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { CommandProviderRegistry } from './command-provider-registry.js'

describe('CommandProviderRegistry', () => {
  it('should register and retrieve a command provider', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(CommandProviderRegistry)
      const provider = vi.fn()

      registry.registerProvider(provider)

      expect(registry.getProviders()).toEqual([provider])
    })
  })

  it('should return empty array when no providers registered', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(CommandProviderRegistry)
      expect(registry.getProviders()).toEqual([])
    })
  })

  it('should return a copy of providers array', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(CommandProviderRegistry)
      const provider = vi.fn()
      registry.registerProvider(provider)

      const providers = registry.getProviders()
      providers.push(vi.fn())

      expect(registry.getProviders()).toHaveLength(1)
    })
  })

  it('should accumulate multiple providers', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(CommandProviderRegistry)
      const p1 = vi.fn()
      const p2 = vi.fn()

      registry.registerProvider(p1)
      registry.registerProvider(p2)

      expect(registry.getProviders()).toEqual([p1, p2])
    })
  })
})
