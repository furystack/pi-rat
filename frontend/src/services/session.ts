import type { IdentityContext, User } from '@furystack/core'
import { defineService, type Token } from '@furystack/inject'
import { NotyService } from '@furystack/shades-common-components'
import { ObservableValue, usingAsync } from '@furystack/utils'
import type { Roles } from 'common'
import { navigateToRoute } from '../utils/navigate-to-route.js'
import { IdentityApiClient } from './api-clients/identity-api-client.js'

export type SessionState = 'initializing' | 'offline' | 'unauthenticated' | 'authenticated'

export interface SessionService extends IdentityContext, Disposable {
  readonly state: ObservableValue<SessionState>
  readonly currentUser: ObservableValue<User | null>
  readonly isOperationInProgress: ObservableValue<boolean>
  readonly loginError: ObservableValue<string>
  init(): Promise<void>
  login(username: string, password: string): Promise<void>
  register(username: string, password: string): Promise<void>
  logout(): Promise<void>
  resetPassword(currentPassword: string, newPassword: string): Promise<void>
}

export const SessionService: Token<SessionService, 'singleton'> = defineService({
  name: 'pi-rat/SessionService',
  lifetime: 'singleton',
  factory: ({ inject, injector, onDispose }) => {
    const api = inject(IdentityApiClient)
    const notys = inject(NotyService)

    const state = new ObservableValue<SessionState>('initializing')
    const currentUser = new ObservableValue<User | null>(null)
    const isOperationInProgress = new ObservableValue(true)
    const loginError = new ObservableValue('')

    let isDisposed = false
    let isInitialized = false

    const operation = (): Disposable => {
      isOperationInProgress.setValue(true)
      return {
        [Symbol.dispose]: () => {
          if (!isDisposed) {
            isOperationInProgress.setValue(false)
          }
        },
      }
    }

    const init = async (): Promise<void> => {
      await usingAsync(operation(), async () => {
        if (isInitialized) return
        isInitialized = true
        try {
          const { result } = await api.call({ method: 'GET', action: '/isAuthenticated' })
          if (isDisposed) return
          state.setValue(result.isAuthenticated ? 'authenticated' : 'unauthenticated')
          if (result.isAuthenticated) {
            const { result: usr } = await api.call({ method: 'GET', action: '/currentUser' })
            if (isDisposed) return
            currentUser.setValue({ username: usr.username, roles: usr.roles })
          }
        } catch {
          if (!isDisposed) {
            state.setValue('offline')
          }
        }
      })
    }

    const login = async (username: string, password: string): Promise<void> => {
      loginError.setValue('')
      await usingAsync(operation(), async () => {
        try {
          const { result: usr } = await api.call({ method: 'POST', action: '/login', body: { username, password } })
          if (isDisposed) return
          currentUser.setValue({ username: usr.username, roles: usr.roles })
          state.setValue('authenticated')
          notys.emit('onNotyAdded', {
            body: 'Welcome back ;)',
            title: 'You have been logged in',
            type: 'success',
          })
        } catch (error) {
          if (isDisposed) return
          loginError.setValue(error instanceof Error ? error.message : '')
          notys.emit('onNotyAdded', {
            body: 'Please check your credentials',
            title: 'Login failed',
            type: 'warning',
          })
        }
      })
    }

    const register = async (username: string, password: string): Promise<void> => {
      loginError.setValue('')
      await usingAsync(operation(), async () => {
        try {
          const { result: usr } = await api.call({
            method: 'POST',
            action: '/register',
            body: { username, password },
          })
          if (isDisposed) return
          currentUser.setValue({ username: usr.username, roles: usr.roles })
          state.setValue('authenticated')
          navigateToRoute(injector, '/')
          notys.emit('onNotyAdded', {
            body: 'Welcome to PI-RAT!',
            title: 'Account created successfully',
            type: 'success',
          })
        } catch (error) {
          if (isDisposed) return
          loginError.setValue(error instanceof Error ? error.message : '')
          notys.emit('onNotyAdded', {
            body: 'Please check your details and try again',
            title: 'Registration failed',
            type: 'warning',
          })
        }
      })
    }

    const logout = async (): Promise<void> => {
      await usingAsync(operation(), async () => {
        try {
          await api.call({ method: 'POST', action: '/logout' })
        } catch {
          // Logout failure is non-critical — session is cleared client-side regardless
        }
        if (isDisposed) return
        currentUser.setValue(null)
        state.setValue('unauthenticated')
        notys.emit('onNotyAdded', {
          body: 'Come back soon...',
          title: 'You have been logged out',
          type: 'info',
        })
        navigateToRoute(injector, '/')
      })
    }

    const resetPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
      await usingAsync(operation(), async () => {
        const { result } = await api.call({
          method: 'POST',
          action: '/password-reset',
          body: { currentPassword, newPassword },
        })
        if (isDisposed) return
        if (result.success) {
          notys.emit('onNotyAdded', {
            body: 'Your password has been updated successfully',
            title: 'Password updated',
            type: 'success',
          })
        }
      })
    }

    const isAuthenticated = async (): Promise<boolean> => state.getValue() === 'authenticated'

    const getCurrentUserOrThrow = <TUser extends User>(): TUser => {
      const usr = currentUser.getValue()
      if (!usr) {
        notys.emit('onNotyAdded', {
          body: ':(((',
          title: 'No User available',
          type: 'warning',
        })
        throw new Error('No user available')
      }
      return usr as TUser
    }

    const isAuthorized = async (...roles: Roles): Promise<boolean> => {
      const usr = currentUser.getValue()
      if (!usr) return false
      return roles.every((role) => usr.roles.includes(role))
    }

    const getCurrentUser = async <TUser extends User>(): Promise<TUser> => getCurrentUserOrThrow<TUser>()

    onDispose(() => {
      isDisposed = true
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
      state[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
      currentUser[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
      isOperationInProgress[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
      loginError[Symbol.dispose]()
    })

    const dispose = () => {
      isDisposed = true
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to caller
      state[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to caller
      currentUser[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to caller
      isOperationInProgress[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to caller
      loginError[Symbol.dispose]()
    }

    return {
      state,
      currentUser,
      isOperationInProgress,
      loginError,
      init,
      login,
      register,
      logout,
      resetPassword,
      isAuthenticated,
      isAuthorized,
      getCurrentUser,
      [Symbol.dispose]: dispose,
    }
  },
})
