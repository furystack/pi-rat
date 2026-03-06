import type { IdentityContext, User } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import { NotyService } from '@furystack/shades-common-components'
import { ObservableValue, usingAsync } from '@furystack/utils'
import type { Roles } from 'common'
import { navigateToRoute } from '../navigate-to-route.js'
import { IdentityApiClient } from './api-clients/identity-api-client.js'

export type SessionState = 'initializing' | 'offline' | 'unauthenticated' | 'authenticated'

@Injectable({ lifetime: 'singleton' })
export class SessionService implements IdentityContext, Disposable {
  declare private readonly injector: Injector
  private readonly operation = () => {
    this.isOperationInProgress.setValue(true)
    return {
      [Symbol.dispose]: () => {
        if (!this.isDisposed) {
          this.isOperationInProgress.setValue(false)
        }
      },
    }
  }

  private isDisposed = false

  public state = new ObservableValue<SessionState>('initializing')
  public currentUser = new ObservableValue<Pick<User, 'username' | 'roles'> | null>(null)

  public isOperationInProgress = new ObservableValue(true)

  public loginError = new ObservableValue('')

  private isInitialized = false

  public async init() {
    await usingAsync(this.operation(), async () => {
      if (!this.isInitialized) {
        this.isInitialized = true
        try {
          const { result } = await this.api.call({ method: 'GET', action: '/isAuthenticated' })
          if (this.isDisposed) return
          this.state.setValue(result.isAuthenticated ? 'authenticated' : 'unauthenticated')
          if (result.isAuthenticated) {
            const { result: usr } = await this.api.call({ method: 'GET', action: '/currentUser' })
            if (this.isDisposed) return
            this.currentUser.setValue({ username: usr.username, roles: usr.roles })
          }
        } catch (error) {
          if (!this.isDisposed) {
            this.state.setValue('offline')
          }
        }
      }
    })
  }

  public async login(username: string, password: string): Promise<void> {
    await usingAsync(this.operation(), async () => {
      try {
        const { result: usr } = await this.api.call({ method: 'POST', action: '/login', body: { username, password } })
        this.currentUser.setValue({ username: usr.username, roles: usr.roles })
        this.state.setValue('authenticated')
        this.notys.emit('onNotyAdded', {
          body: 'Welcome back ;)',
          title: 'You have been logged in',
          type: 'success',
        })
      } catch (error) {
        this.loginError.setValue(error instanceof Error ? error.message : '')
        this.notys.emit('onNotyAdded', {
          body: 'Please check your credentials',
          title: 'Login failed',
          type: 'warning',
        })
      }
    })
  }

  public async register(username: string, password: string): Promise<void> {
    await usingAsync(this.operation(), async () => {
      try {
        const { result: usr } = await this.api.call({
          method: 'POST',
          action: '/register',
          body: { username, password },
        })
        this.currentUser.setValue({ username: usr.username, roles: usr.roles })
        this.state.setValue('authenticated')
        navigateToRoute(this.injector, '/')
        this.notys.emit('onNotyAdded', {
          body: 'Welcome to PI-RAT!',
          title: 'Account created successfully',
          type: 'success',
        })
      } catch (error) {
        this.loginError.setValue(error instanceof Error ? error.message : '')
        this.notys.emit('onNotyAdded', {
          body: 'Please check your details and try again',
          title: 'Registration failed',
          type: 'warning',
        })
      }
    })
  }

  public async logout(): Promise<void> {
    return await usingAsync(this.operation(), async () => {
      void this.api.call({ method: 'POST', action: '/logout' })
      this.currentUser.setValue(null)
      this.state.setValue('unauthenticated')
      this.notys.emit('onNotyAdded', {
        body: 'Come back soon...',
        title: 'You have been logged out',
        type: 'info',
      })
      navigateToRoute(this.injector, '/')
    })
  }

  public async isAuthenticated(): Promise<boolean> {
    return this.state.getValue() === 'authenticated'
  }

  public async resetPassword(currentPassword: string, newPassword: string): Promise<void> {
    await usingAsync(this.operation(), async () => {
      const { result } = await this.api.call({
        method: 'POST',
        action: '/password-reset',
        body: { currentPassword, newPassword },
      })

      if (result.success) {
        this.notys.emit('onNotyAdded', {
          body: 'Your password has been updated successfully',
          title: 'Password updated',
          type: 'success',
        })
      }
    })
  }
  public async isAuthorized(...roles: Roles): Promise<boolean> {
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
      this.notys.emit('onNotyAdded', {
        body: ':(((',
        title: 'No User available',
        type: 'warning',
      })
      throw Error('No user available')
    }
    return {
      username: currentUser.username,
      roles: currentUser.roles,
    } as TUser
  }

  @Injected(IdentityApiClient)
  declare private api: IdentityApiClient

  @Injected(NotyService)
  declare private readonly notys: NotyService

  public [Symbol.dispose](): void {
    this.isDisposed = true
    this.state[Symbol.dispose]()
    this.currentUser[Symbol.dispose]()
    this.loginError[Symbol.dispose]()
    this.isOperationInProgress[Symbol.dispose]()
  }
}
