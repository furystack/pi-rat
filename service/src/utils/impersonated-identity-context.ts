import type { User as FsUser } from '@furystack/core'
import { IdentityContext } from '@furystack/core'
import type { Roles, User } from 'common'

export class ImpersonatedIdentityContext extends IdentityContext {
  constructor(private readonly user?: User) {
    super()
  }

  public isAuthenticated() {
    return Promise.resolve(!!this.user)
  }

  public async isAuthorized(...roles: string[]) {
    return roles.every((role) => this.user?.roles.includes(role as Roles[number]))
  }

  public async getCurrentUser<TUser extends FsUser>() {
    if (!this.user) {
      throw new Error('No user is impersonated')
    }
    return this.user as unknown as TUser
  }
}
