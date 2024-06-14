import { IdentityContext } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { withRole } from './with-role.js'
import { describe, expect, it } from 'vitest'

describe('withRoleOnly', () => {
  it('Should fail if not authorized', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ic = i.getInstance(IdentityContext)
      Object.assign(ic, { isAuthenticated: async () => false })
      i.setExplicitInstance(ic)
      const result = await withRole('admin')({ injector: i })
      expect(result).toEqual({
        isAllowed: false,
        message: 'You are not authorized :(',
      })
    })
  })
  it('Should fail if authorized without roles', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ic = i.getInstance(IdentityContext)
      Object.assign(ic, { isAuthenticated: async () => true })
      i.setExplicitInstance(ic)
      const result = await withRole('admin')({ injector: i })
      expect(result).toEqual({
        isAllowed: false,
        message: 'You are not authorized :(',
      })
    })
  })

  it('Should pass if authorized and roles are provided', async () => {
    await usingAsync(new Injector(), async (i) => {
      const ic = i.getInstance(IdentityContext)
      Object.assign(ic, { isAuthenticated: async () => true })
      Object.assign(ic, { isAuthorized: async () => true })

      i.setExplicitInstance(ic)
      const result = await withRole('role1', 'admin')({ injector: i })
      expect(result).toEqual({
        isAllowed: true,
      })
    })
  })
})
