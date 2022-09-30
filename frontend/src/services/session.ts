import type { IdentityContext } from '@furystack/core'
import { ObservableValue, usingAsync } from '@furystack/utils'
import { Injectable, Injected } from '@furystack/inject'
import { NotyService } from '@furystack/shades-common-components'
import type { User } from 'common'
import { IdentityApiClient } from './identity-api-client'

export type SessionState = 'initializing' | 'offline' | 'unauthenticated' | 'authenticated'

@Injectable({ lifetime: 'singleton' })
export class SessionService implements IdentityContext {
  private readonly operation = () => {
    this.isOperationInProgress.setValue(true)
    return { dispose: () => this.isOperationInProgress.setValue(false) }
  }

  public state = new ObservableValue<SessionState>('initializing')
  public currentUser = new ObservableValue<Omit<User, 'password'> | null>(null)

  public isOperationInProgress = new ObservableValue(true)

  public loginError = new ObservableValue('')

  private isInitialized = false

  public async init() {
    await usingAsync(this.operation(), async () => {
      if (!this.isInitialized) {
        this.isInitialized = true
        try {
          const { result } = await this.api.call({ method: 'GET', action: '/isAuthenticated' })
          this.state.setValue(result.isAuthenticated ? 'authenticated' : 'unauthenticated')
          if (result.isAuthenticated) {
            const { result: usr } = await this.api.call({ method: 'GET', action: '/currentUser' })
            this.currentUser.setValue(usr)
          }
        } catch (error) {
          this.state.setValue('offline')
        }
      }
    })
  }

  public async login(username: string, password: string): Promise<void> {
    await usingAsync(this.operation(), async () => {
      try {
        const { result: usr } = await this.api.call({ method: 'POST', action: '/login', body: { username, password } })
        this.currentUser.setValue(usr)
        this.state.setValue('authenticated')
        this.notys.addNoty({
          body: 'Welcome back ;)',
          title: 'You have been logged in',
          type: 'success',
        })
      } catch (error) {
        this.loginError.setValue(error instanceof Error ? error.message : '')
        this.notys.addNoty({
          body: 'Please check your credentials',
          title: 'Login failed',
          type: 'warning',
        })
      }
    })
  }

  public async logout(): Promise<void> {
    return await usingAsync(this.operation(), async () => {
      this.api.call({ method: 'POST', action: '/logout' })
      this.currentUser.setValue(null)
      this.state.setValue('unauthenticated')
      this.notys.addNoty({
        body: 'Come back soon...',
        title: 'You have been logged out',
        type: 'info',
      })
    })
  }

  public async isAuthenticated(): Promise<boolean> {
    return this.state.getValue() === 'authenticated'
  }
  public async isAuthorized(...roles: string[]): Promise<boolean> {
    const currentUser = await this.getCurrentUser()
    for (const role of roles) {
      if (!currentUser || !currentUser.roles.some((c) => c === role)) {
        return false
      }
    }
    return true
  }
  public async getCurrentUser<TUser extends User>(): Promise<TUser> {
    const currentUser = this.currentUser.getValue()
    if (!currentUser) {
      this.notys.addNoty({
        body: ':(((',
        title: 'No User available',
        type: 'warning',
      })
      throw Error('No user available')
    }
    return currentUser as unknown as TUser
  }

  @Injected(IdentityApiClient)
  private api!: IdentityApiClient

  @Injected(NotyService)
  private readonly notys!: NotyService
}
