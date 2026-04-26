import { describe, it, expect, vi } from 'vitest'
import { Injector } from '@furystack/inject'
import { NotyService } from '@furystack/shades-common-components'
import { SessionService } from '../services/session.js'
import { IdentityApiClient } from '../services/api-clients/identity-api-client.js'
import { getUser, hasRole, SessionUserUnavailableError } from './session-helpers.js'

vi.mock('./navigate-to-route.js', () => ({
  navigateToRoute: vi.fn(),
}))

const createTestInjector = () => {
  const injector = new Injector()
  injector.bind(IdentityApiClient, () => ({ call: vi.fn() }) as never)
  injector.bind(NotyService, () => ({ emit: vi.fn() }) as never)
  return injector
}

describe('SessionUserUnavailableError', () => {
  it('should have the correct name and message', () => {
    const error = new SessionUserUnavailableError()
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('SessionUserUnavailableError')
    expect(error.message).toBe('No authenticated user available')
  })
})

describe('getUser', () => {
  it('should return the current user when authenticated', () => {
    const injector = createTestInjector()
    const service = injector.get(SessionService)
    service.currentUser.setValue({ username: 'testuser', roles: ['admin'] })

    const user = getUser(injector)

    expect(user).toEqual({ username: 'testuser', roles: ['admin'] })

    service[Symbol.dispose]()
  })

  it('should throw SessionUserUnavailableError when no user is set', () => {
    const injector = createTestInjector()
    const service = injector.get(SessionService)

    expect(() => getUser(injector)).toThrow(SessionUserUnavailableError)

    service[Symbol.dispose]()
  })
})

describe('hasRole', () => {
  it('should return true when user has the role', () => {
    const injector = createTestInjector()
    const service = injector.get(SessionService)
    service.currentUser.setValue({ username: 'admin', roles: ['admin', 'user'] })

    expect(hasRole(injector, 'admin')).toBe(true)
    expect(hasRole(injector, 'user')).toBe(true)

    service[Symbol.dispose]()
  })

  it('should return false when user does not have the role', () => {
    const injector = createTestInjector()
    const service = injector.get(SessionService)
    service.currentUser.setValue({ username: 'user', roles: ['user'] })

    expect(hasRole(injector, 'admin')).toBe(false)

    service[Symbol.dispose]()
  })

  it('should throw SessionUserUnavailableError when no user is set', () => {
    const injector = createTestInjector()
    const service = injector.get(SessionService)

    expect(() => hasRole(injector, 'admin')).toThrow(SessionUserUnavailableError)

    service[Symbol.dispose]()
  })
})
