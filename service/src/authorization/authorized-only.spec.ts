import { IdentityContext } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { authorizedOnly } from './authorized-only.js'
import { describe, expect, it } from 'vitest'

describe('authorizedOnly', () => {
  it('Should fail if not authorized', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ic = i.getInstance(IdentityContext)
      Object.assign(ic, { isAuthenticated: async () => false })
      i.setExplicitInstance(ic)
      const result = await authorizedOnly({ injector: i })
      expect(result).toEqual({
        isAllowed: false,
        message: 'You are not authorized :(',
      })
    })
  })
  it('Should succeed if authorized', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ic = i.getInstance(IdentityContext)
      Object.assign(ic, { isAuthenticated: async () => true })
      i.setExplicitInstance(ic)
      const result = await authorizedOnly({ injector: i })
      expect(result).toEqual({
        isAllowed: true,
      })
    })
  })
})
