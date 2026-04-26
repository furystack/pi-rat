import type { IdentityContext as FrameworkIdentityContext, User as FsUser } from '@furystack/core'
import type { Roles, User } from 'common'

export const createImpersonatedIdentityContext = (user?: User): FrameworkIdentityContext => ({
  isAuthenticated: () => Promise.resolve(!!user),
  isAuthorized: (...roles: string[]) =>
    Promise.resolve(roles.every((role) => user?.roles.includes(role as Roles[number]) ?? false)),
  getCurrentUser: <TUser extends FsUser>(): Promise<TUser> => {
    if (!user) {
      throw new Error('No user is impersonated')
    }
    return Promise.resolve(user as unknown as TUser)
  },
})
