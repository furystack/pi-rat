import { describe, it, expect, vi } from 'vitest'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { NotyService } from '@furystack/shades-common-components'
import { SessionService } from './session.js'
import { IdentityApiClient } from './api-clients/identity-api-client.js'

// Mock the navigate function
vi.mock('../navigate-to-route.js', () => ({
  navigateToRoute: vi.fn(),
}))

describe('SessionService', () => {
  const createTestInjector = (mockCall: ReturnType<typeof vi.fn>) => {
    const injector = new Injector()

    // Mock IdentityApiClient
    injector.setExplicitInstance({ call: mockCall } as unknown as IdentityApiClient, IdentityApiClient)

    // Mock NotyService
    const mockNotyService = {
      emit: vi.fn(),
    }
    injector.setExplicitInstance(mockNotyService as unknown as NotyService, NotyService)

    return { injector, mockNotyService }
  }

  describe('init', () => {
    it('should set state to authenticated when isAuthenticated returns true', async () => {
      const mockCall = vi
        .fn()
        .mockResolvedValueOnce({ result: { isAuthenticated: true } })
        .mockResolvedValueOnce({ result: { username: 'testuser', roles: ['admin'] } })

      const { injector } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)

        await service.init()

        expect(service.state.getValue()).toBe('authenticated')
        expect(service.currentUser.getValue()).toEqual({ username: 'testuser', roles: ['admin'] })
      })
    })

    it('should set state to unauthenticated when isAuthenticated returns false', async () => {
      const mockCall = vi.fn().mockResolvedValueOnce({ result: { isAuthenticated: false } })

      const { injector } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)

        await service.init()

        expect(service.state.getValue()).toBe('unauthenticated')
        expect(service.currentUser.getValue()).toBeNull()
      })
    })

    it('should set state to offline when API call fails', async () => {
      const mockCall = vi.fn().mockRejectedValueOnce(new Error('Network error'))

      const { injector } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)

        await service.init()

        expect(service.state.getValue()).toBe('offline')
      })
    })

    it('should only initialize once', async () => {
      const mockCall = vi.fn().mockResolvedValue({ result: { isAuthenticated: false } })

      const { injector } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)

        await service.init()
        await service.init()

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('login', () => {
    it('should set currentUser and state on successful login', async () => {
      const mockCall = vi.fn().mockResolvedValue({
        result: { username: 'testuser', roles: ['user'] },
      })

      const { injector, mockNotyService } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)

        await service.login('testuser', 'password123')

        expect(service.currentUser.getValue()).toEqual({ username: 'testuser', roles: ['user'] })
        expect(service.state.getValue()).toBe('authenticated')
        expect(mockNotyService.emit).toHaveBeenCalledWith('onNotyAdded', expect.objectContaining({ type: 'success' }))
      })
    })

    it('should set loginError and show warning on failed login', async () => {
      const mockCall = vi.fn().mockRejectedValue(new Error('Invalid credentials'))

      const { injector, mockNotyService } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)

        await service.login('testuser', 'wrongpassword')

        expect(service.loginError.getValue()).toBeTruthy()
        expect(mockNotyService.emit).toHaveBeenCalledWith('onNotyAdded', expect.objectContaining({ type: 'warning' }))
      })
    })

    it('should clear loginError before attempting login', async () => {
      const mockCall = vi.fn().mockResolvedValue({
        result: { username: 'testuser', roles: ['user'] },
      })

      const { injector } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)
        service.loginError.setValue('previous error')

        await service.login('testuser', 'password123')

        expect(service.loginError.getValue()).toBe('')
      })
    })
  })

  describe('register', () => {
    it('should set currentUser and state on successful registration', async () => {
      const mockCall = vi.fn().mockResolvedValue({
        result: { username: 'newuser', roles: [] },
      })

      const { injector, mockNotyService } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)

        await service.register('newuser', 'password123')

        expect(service.currentUser.getValue()).toEqual({ username: 'newuser', roles: [] })
        expect(service.state.getValue()).toBe('authenticated')
        expect(mockNotyService.emit).toHaveBeenCalledWith('onNotyAdded', expect.objectContaining({ type: 'success' }))
      })
    })

    it('should set loginError and show warning on failed registration', async () => {
      const mockCall = vi.fn().mockRejectedValue(new Error('User already exists'))

      const { injector, mockNotyService } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)

        await service.register('existinguser', 'password123')

        expect(service.loginError.getValue()).toBeTruthy()
        expect(mockNotyService.emit).toHaveBeenCalledWith('onNotyAdded', expect.objectContaining({ type: 'warning' }))
      })
    })

    it('should clear loginError before attempting registration', async () => {
      const mockCall = vi.fn().mockResolvedValue({
        result: { username: 'newuser', roles: [] },
      })

      const { injector } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)
        service.loginError.setValue('previous error')

        await service.register('newuser', 'password123')

        expect(service.loginError.getValue()).toBe('')
      })
    })
  })

  describe('logout', () => {
    it('should call logout API and clear currentUser', async () => {
      const mockCall = vi.fn().mockResolvedValue({})

      const { injector, mockNotyService } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)

        service.currentUser.setValue({ username: 'testuser', roles: ['user'] })

        await service.logout()

        expect(mockCall).toHaveBeenCalledWith({ method: 'POST', action: '/logout' })
        expect(service.currentUser.getValue()).toBeNull()
        expect(mockNotyService.emit).toHaveBeenCalledWith('onNotyAdded', expect.objectContaining({ type: 'info' }))
      })
    })

    it('should still clear state when logout API call fails', async () => {
      const mockCall = vi.fn().mockRejectedValue(new Error('Network error'))

      const { injector, mockNotyService } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)

        service.currentUser.setValue({ username: 'testuser', roles: ['user'] })
        service.state.setValue('authenticated')

        await service.logout()

        expect(service.currentUser.getValue()).toBeNull()
        expect(service.state.getValue()).toBe('unauthenticated')
        expect(mockNotyService.emit).toHaveBeenCalledWith('onNotyAdded', expect.objectContaining({ type: 'info' }))
      })
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when state is authenticated', async () => {
      const mockCall = vi.fn()

      const { injector } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)
        service.state.setValue('authenticated')

        const result = await service.isAuthenticated()

        expect(result).toBe(true)
      })
    })

    it('should return false when state is unauthenticated', async () => {
      const mockCall = vi.fn()

      const { injector } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)
        service.state.setValue('unauthenticated')

        const result = await service.isAuthenticated()

        expect(result).toBe(false)
      })
    })
  })

  describe('isAuthorized', () => {
    it('should return true when user has all required roles', async () => {
      const mockCall = vi.fn()

      const { injector } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)
        service.currentUser.setValue({ username: 'admin', roles: ['admin', 'user'] })

        const result = await service.isAuthorized('admin')

        expect(result).toBe(true)
      })
    })

    it('should return false when user is missing a required role', async () => {
      const mockCall = vi.fn()

      const { injector } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)
        service.currentUser.setValue({ username: 'user', roles: ['user'] })

        const result = await service.isAuthorized('admin')

        expect(result).toBe(false)
      })
    })

    it('should return true when no roles are required', async () => {
      const mockCall = vi.fn()

      const { injector } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)
        service.currentUser.setValue({ username: 'user', roles: [] })

        const result = await service.isAuthorized()

        expect(result).toBe(true)
      })
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user when user is set', async () => {
      const mockCall = vi.fn()

      const { injector } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)
        service.currentUser.setValue({ username: 'testuser', roles: ['user'] })

        const result = await service.getCurrentUser()

        expect(result).toEqual({ username: 'testuser', roles: ['user'] })
      })
    })

    it('should throw error and show notification when no user is available', async () => {
      const mockCall = vi.fn()

      const { injector, mockNotyService } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)
        service.currentUser.setValue(null)

        await expect(service.getCurrentUser()).rejects.toThrow('No user available')
        expect(mockNotyService.emit).toHaveBeenCalledWith('onNotyAdded', expect.objectContaining({ type: 'warning' }))
      })
    })
  })

  describe('resetPassword', () => {
    it('should call API and show success notification on successful password reset', async () => {
      // Use mockResolvedValue to ensure it returns the result for any call
      const mockCall = vi.fn().mockResolvedValue({ result: { success: true } })

      const { injector, mockNotyService } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)

        await service.resetPassword('oldPassword', 'newPassword')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'POST',
          action: '/password-reset',
          body: { currentPassword: 'oldPassword', newPassword: 'newPassword' },
        })
        expect(mockNotyService.emit).toHaveBeenCalledWith('onNotyAdded', expect.objectContaining({ type: 'success' }))
      })
    })
  })

  describe('dispose', () => {
    it('should not update state when disposed during init', async () => {
      let resolveAuth: (value: unknown) => void
      const mockCall = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveAuth = resolve
          }),
      )

      const { injector } = createTestInjector(mockCall)
      const service = injector.getInstance(SessionService)

      const setStateSpy = vi.spyOn(service.state, 'setValue')
      const setCurrentUserSpy = vi.spyOn(service.currentUser, 'setValue')

      const initPromise = service.init()
      setStateSpy.mockClear()
      setCurrentUserSpy.mockClear()

      service[Symbol.dispose]()

      resolveAuth!({ result: { isAuthenticated: true } })
      await initPromise

      expect(setStateSpy).not.toHaveBeenCalled()
      expect(setCurrentUserSpy).not.toHaveBeenCalled()
    })

    it('should not update state when disposed during init error', async () => {
      let rejectAuth: (reason: unknown) => void
      const mockCall = vi.fn().mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            rejectAuth = reject
          }),
      )

      const { injector } = createTestInjector(mockCall)
      const service = injector.getInstance(SessionService)

      const setStateSpy = vi.spyOn(service.state, 'setValue')

      const initPromise = service.init()
      setStateSpy.mockClear()

      service[Symbol.dispose]()

      rejectAuth!(new Error('Network error'))
      await initPromise

      expect(setStateSpy).not.toHaveBeenCalled()
    })

    it('should dispose all observables', async () => {
      const mockCall = vi.fn()

      const { injector } = createTestInjector(mockCall)
      const service = injector.getInstance(SessionService)

      service[Symbol.dispose]()

      expect(() => service.state.setValue('offline')).toThrow()
      expect(() => service.currentUser.setValue(null)).toThrow()
      expect(() => service.loginError.setValue('test')).toThrow()
      expect(() => service.isOperationInProgress.setValue(false)).toThrow()
    })
  })

  describe('isOperationInProgress', () => {
    it('should be true during operations', async () => {
      let capturedInProgress: boolean | undefined
      const mockCall = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ result: { isAuthenticated: false } })
          }, 10)
        })
      })

      const { injector } = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(SessionService)

        const initPromise = service.init()

        capturedInProgress = service.isOperationInProgress.getValue()

        await initPromise

        expect(capturedInProgress).toBe(true)
        expect(service.isOperationInProgress.getValue()).toBe(false)
      })
    })
  })
})
