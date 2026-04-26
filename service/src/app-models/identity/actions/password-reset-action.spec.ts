import type { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { RequestError } from '@furystack/rest'
import { PasswordAuthenticator, PasswordComplexityError, UnauthenticatedError } from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PasswordResetAction } from './password-reset-action.js'

// Mock getCurrentUser
const mockGetCurrentUser = vi.fn()

vi.mock('@furystack/core', () => {
  return {
    getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args) as unknown,
  }
})

// Mock getLogger
vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      warning: vi.fn().mockResolvedValue(undefined),
      information: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

describe('PasswordResetAction', () => {
  const createTestInjector = () => {
    const injector = new Injector()

    const mockAuthenticator = {
      setPasswordForUser: vi.fn().mockResolvedValue(undefined),
    }

    injector.bind(PasswordAuthenticator, () => mockAuthenticator as unknown as PasswordAuthenticator)

    return { injector, mockAuthenticator }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reset password successfully for authenticated user', async () => {
    const { injector, mockAuthenticator } = createTestInjector()

    mockGetCurrentUser.mockResolvedValue({ username: 'testuser', roles: [] })

    await usingAsync(injector, async (i) => {
      const result = await PasswordResetAction({
        injector: i,
        getBody: async () => ({ currentPassword: 'oldpass', newPassword: 'newpass123' }),
        response: {} as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(mockAuthenticator.setPasswordForUser).toHaveBeenCalledWith('testuser', 'oldpass', 'newpass123')
      expect(result.chunk).toEqual({ success: true })
    })
  })

  it('should throw 401 when user is not authenticated', async () => {
    const { injector } = createTestInjector()

    mockGetCurrentUser.mockResolvedValue(null)

    await usingAsync(injector, async (i) => {
      try {
        await PasswordResetAction({
          injector: i,
          getBody: async () => ({ currentPassword: 'oldpass', newPassword: 'newpass123' }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect((error as RequestError).responseCode).toBe(401)
        expect((error as RequestError).message).toBe('User not authenticated')
      }
    })
  })

  it('should throw 400 when current password is incorrect', async () => {
    const { injector, mockAuthenticator } = createTestInjector()

    mockGetCurrentUser.mockResolvedValue({ username: 'testuser', roles: [] })
    mockAuthenticator.setPasswordForUser.mockRejectedValue(new UnauthenticatedError())

    await usingAsync(injector, async (i) => {
      try {
        await PasswordResetAction({
          injector: i,
          getBody: async () => ({ currentPassword: 'wrongpass', newPassword: 'newpass123' }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect((error as RequestError).responseCode).toBe(400)
        expect((error as RequestError).message).toBe('Current password is incorrect')
      }
    })
  })

  it('should throw 400 when new password does not meet complexity requirements', async () => {
    const { injector, mockAuthenticator } = createTestInjector()

    mockGetCurrentUser.mockResolvedValue({ username: 'testuser', roles: [] })
    mockAuthenticator.setPasswordForUser.mockRejectedValue(
      new PasswordComplexityError([{ message: 'Password too weak', rule: 'minLength' }]),
    )

    await usingAsync(injector, async (i) => {
      try {
        await PasswordResetAction({
          injector: i,
          getBody: async () => ({ currentPassword: 'oldpass', newPassword: 'weak' }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect((error as RequestError).responseCode).toBe(400)
        expect((error as RequestError).message).toContain('complexity requirements')
      }
    })
  })

  it('should rethrow RequestError as-is', async () => {
    const { injector, mockAuthenticator } = createTestInjector()

    mockGetCurrentUser.mockResolvedValue({ username: 'testuser', roles: [] })
    const originalError = new RequestError('Custom error', 422)
    mockAuthenticator.setPasswordForUser.mockRejectedValue(originalError)

    await usingAsync(injector, async (i) => {
      try {
        await PasswordResetAction({
          injector: i,
          getBody: async () => ({ currentPassword: 'oldpass', newPassword: 'newpass123' }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBe(originalError)
        expect((error as RequestError).responseCode).toBe(422)
      }
    })
  })

  it('should throw 500 for unknown errors', async () => {
    const { injector, mockAuthenticator } = createTestInjector()

    mockGetCurrentUser.mockResolvedValue({ username: 'testuser', roles: [] })
    mockAuthenticator.setPasswordForUser.mockRejectedValue(new Error('Unknown database error'))

    await usingAsync(injector, async (i) => {
      try {
        await PasswordResetAction({
          injector: i,
          getBody: async () => ({ currentPassword: 'oldpass', newPassword: 'newpass123' }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect((error as RequestError).responseCode).toBe(500)
        expect((error as RequestError).message).toBe('Password reset failed')
      }
    })
  })
})
