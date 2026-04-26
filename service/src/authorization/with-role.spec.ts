import { IdentityContext } from '@furystack/core'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { withRole } from './with-role.js'

const buildIdentityContext = (overrides: Partial<IdentityContext>): IdentityContext => ({
  isAuthenticated: async () => false,
  isAuthorized: async () => false,
  getCurrentUser: async () => {
    throw new Error('No user')
  },
  ...overrides,
})

describe('withRoleOnly', () => {
  it('Should fail if not authorized', async () => {
    await usingAsync(createInjector(), async (i) => {
      i.bind(IdentityContext, () => buildIdentityContext({ isAuthenticated: async () => false }))
      const result = await withRole('admin')({ injector: i })
      expect(result).toEqual({
        isAllowed: false,
        message: 'You are not authorized :(',
      })
    })
  })

  it('Should fail if authorized without roles', async () => {
    await usingAsync(createInjector(), async (i) => {
      i.bind(IdentityContext, () =>
        buildIdentityContext({ isAuthenticated: async () => true, isAuthorized: async () => false }),
      )
      const result = await withRole('admin')({ injector: i })
      expect(result).toEqual({
        isAllowed: false,
        message: 'You are not authorized :(',
      })
    })
  })

  it('Should pass if authorized and roles are provided', async () => {
    await usingAsync(createInjector(), async (i) => {
      i.bind(IdentityContext, () =>
        buildIdentityContext({ isAuthenticated: async () => true, isAuthorized: async () => true }),
      )
      const result = await withRole('admin')({ injector: i })
      expect(result).toEqual({
        isAllowed: true,
      })
    })
  })
})
