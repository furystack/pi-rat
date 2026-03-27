import { describe, expect, it } from 'vitest'

import { ExternalServiceStatusRegistry } from './external-service-status-registry.js'

describe('ExternalServiceStatusRegistry', () => {
  it('should return empty statuses when no providers are registered', () => {
    const registry = new ExternalServiceStatusRegistry()
    expect(registry.getStatuses()).toEqual({})
  })

  it('should register a provider and return its status', () => {
    const registry = new ExternalServiceStatusRegistry()
    registry.register('omdb', () => true)
    expect(registry.getStatuses()).toEqual({ omdb: true })
  })

  it('should return statuses for multiple providers', () => {
    const registry = new ExternalServiceStatusRegistry()
    registry.register('omdb', () => true)
    registry.register('tmdb', () => false)
    expect(registry.getStatuses()).toEqual({ omdb: true, tmdb: false })
  })

  it('should overwrite a provider when registered with the same name', () => {
    const registry = new ExternalServiceStatusRegistry()
    registry.register('omdb', () => true)
    registry.register('omdb', () => false)
    expect(registry.getStatuses()).toEqual({ omdb: false })
  })

  it('should call status getters on each getStatuses invocation', () => {
    const registry = new ExternalServiceStatusRegistry()
    let isUp = false
    registry.register('service', () => isUp)

    expect(registry.getStatuses()).toEqual({ service: false })
    isUp = true
    expect(registry.getStatuses()).toEqual({ service: true })
  })
})
