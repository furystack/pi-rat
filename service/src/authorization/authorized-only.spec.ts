import { IdentityContext } from '@furystack/core'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { authorizedOnly } from './authorized-only.js'
import { describe, expect, it } from 'vitest'

const buildIdentityContext = (overrides: Partial<IdentityContext>): IdentityContext => ({
  isAuthenticated: async () => false,
  isAuthorized: async () => false,
  getCurrentUser: async () => {
    throw new Error('No user')
  },
  ...overrides,
})

describe('authorizedOnly', () => {
  it('Should fail if not authorized', async () => {
    await usingAsync(createInjector(), async (i) => {
      i.bind(IdentityContext, () => buildIdentityContext({ isAuthenticated: async () => false }))
      const result = await authorizedOnly({ injector: i })
      expect(result).toEqual({
        isAllowed: false,
        message: 'You are not authorized :(',
      })
    })
  })

  it('Should succeed if authorized', async () => {
    await usingAsync(createInjector(), async (i) => {
      i.bind(IdentityContext, () => buildIdentityContext({ isAuthenticated: async () => true }))
      const result = await authorizedOnly({ injector: i })
      expect(result).toEqual({
        isAllowed: true,
      })
    })
  })
})
