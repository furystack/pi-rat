import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'

import { ExternalServiceStatusRegistry } from './external-service-status-registry.js'

const createRegistry = async (fn: (registry: ExternalServiceStatusRegistry) => void | Promise<void>) =>
  usingAsync(createInjector(), async (injector) => {
    await fn(injector.get(ExternalServiceStatusRegistry))
  })

describe('ExternalServiceStatusRegistry', () => {
  it('should return empty statuses when no providers are registered', () =>
    createRegistry((registry) => {
      expect(registry.getStatuses()).toEqual({})
    }))

  it('should register a provider and return its status', () =>
    createRegistry((registry) => {
      registry.register('omdb', () => true)
      expect(registry.getStatuses()).toEqual({ omdb: true })
    }))

  it('should return statuses for multiple providers', () =>
    createRegistry((registry) => {
      registry.register('omdb', () => true)
      registry.register('tmdb', () => false)
      expect(registry.getStatuses()).toEqual({ omdb: true, tmdb: false })
    }))

  it('should overwrite a provider when registered with the same name', () =>
    createRegistry((registry) => {
      registry.register('omdb', () => true)
      registry.register('omdb', () => false)
      expect(registry.getStatuses()).toEqual({ omdb: false })
    }))

  it('should call status getters on each getStatuses invocation', () =>
    createRegistry((registry) => {
      let isUp = false
      registry.register('service', () => isUp)

      expect(registry.getStatuses()).toEqual({ service: false })
      isUp = true
      expect(registry.getStatuses()).toEqual({ service: true })
    }))
})
