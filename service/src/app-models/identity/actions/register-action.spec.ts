import type { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { RequestError } from '@furystack/rest'
import { HttpUserContext } from '@furystack/rest-service'
import { PasswordAuthenticator } from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { RegisterAction } from './register-action.js'

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      warning: vi.fn().mockResolvedValue(undefined),
      information: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

const mockUserDataSet = {
  get: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
}

const mockCredentialDataSet = {
  add: vi.fn(),
}

vi.mock('@furystack/core', () => ({
  useSystemIdentityContext: ({ injector }: { injector: unknown }) => injector,
}))

vi.mock('@furystack/repository', () => ({
  defineDataSet: ({ name, store }: { name: string; store: unknown }) => ({ name, store }),
  getDataSetFor: (_injector: unknown, token: { name?: string } | ((...args: unknown[]) => unknown)) => {
    const tokenName = typeof token === 'function' ? token.name : (token?.name ?? '')
    if (tokenName.includes('UserDataSet')) return mockUserDataSet
    if (tokenName.includes('PasswordCredentialDataSet')) return mockCredentialDataSet
    // eslint-disable-next-line furystack/rest-action-use-request-error -- Test mock helper, not a REST action
    throw new Error(`Unknown token: ${tokenName}`)
  },
}))

describe('RegisterAction', () => {
  const createTestInjector = () => {
    const injector = new Injector()

    const mockHasher = {
      createCredential: vi.fn().mockResolvedValue({
        userName: 'testuser',
        passwordHash: 'hashedpassword',
        passwordSalt: 'salt',
      }),
    }

    const mockAuthenticator = {
      hasher: mockHasher,
    }

    const mockUserContext = {
      authenticateUser: vi.fn().mockResolvedValue({ username: 'testuser', roles: [] }),
      cookieLogin: vi.fn().mockResolvedValue(undefined),
    }

    injector.bind(PasswordAuthenticator, () => mockAuthenticator as unknown as PasswordAuthenticator)
    injector.bind(HttpUserContext, () => mockUserContext as unknown as HttpUserContext)

    return { injector, mockHasher, mockUserContext }
  }

  it('should register a new user successfully', async () => {
    const { injector, mockUserContext } = createTestInjector()

    mockUserDataSet.get.mockResolvedValue(null)
    mockUserDataSet.add.mockResolvedValue(undefined)
    mockCredentialDataSet.add.mockResolvedValue(undefined)

    await usingAsync(injector, async (i) => {
      const result = await RegisterAction({
        injector: i,
        getBody: async () => ({ username: 'newuser', password: 'password123' }),
        response: {} as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(mockUserDataSet.get).toHaveBeenCalledWith(i, 'newuser')
      expect(mockUserDataSet.add).toHaveBeenCalledWith(
        i,
        expect.objectContaining({
          username: 'newuser',
          roles: [],
        }),
      )
      expect(mockCredentialDataSet.add).toHaveBeenCalled()
      expect(mockUserContext.authenticateUser).toHaveBeenCalledWith('newuser', 'password123')
      expect(mockUserContext.cookieLogin).toHaveBeenCalled()
      expect(result.chunk).toEqual({ username: 'newuser', roles: [] })
    })
  })

  it('should throw 409 when user already exists', async () => {
    const { injector } = createTestInjector()

    mockUserDataSet.get.mockResolvedValue({ username: 'existinguser', roles: [] })

    await usingAsync(injector, async (i) => {
      try {
        await RegisterAction({
          injector: i,
          getBody: async () => ({ username: 'existinguser', password: 'password123' }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect((error as RequestError).responseCode).toBe(409)
        expect((error as RequestError).message).toBe('User already exists')
      }
    })
  })

  it('should throw 400 when credential creation fails', async () => {
    const { injector, mockHasher } = createTestInjector()

    mockUserDataSet.get.mockResolvedValue(null)
    mockHasher.createCredential.mockRejectedValue(new Error('Invalid password'))

    await usingAsync(injector, async (i) => {
      try {
        await RegisterAction({
          injector: i,
          getBody: async () => ({ username: 'newuser', password: 'weak' }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect((error as RequestError).responseCode).toBe(400)
        expect((error as RequestError).message).toBe('Registration failed')
      }
    })
  })

  it('should cleanup user when registration fails after user creation', async () => {
    const { injector } = createTestInjector()

    mockUserDataSet.get.mockResolvedValue(null)
    mockUserDataSet.add.mockResolvedValue(undefined)
    mockCredentialDataSet.add.mockRejectedValue(new Error('Credential store error'))
    mockUserDataSet.remove.mockResolvedValue(undefined)

    await usingAsync(injector, async (i) => {
      try {
        await RegisterAction({
          injector: i,
          getBody: async () => ({ username: 'newuser', password: 'password123' }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect(mockUserDataSet.remove).toHaveBeenCalledWith(i, 'newuser')
      }
    })
  })

  it('should not fail if cleanup fails', async () => {
    const { injector } = createTestInjector()

    mockUserDataSet.get.mockResolvedValue(null)
    mockUserDataSet.add.mockResolvedValue(undefined)
    mockCredentialDataSet.add.mockRejectedValue(new Error('Credential store error'))
    mockUserDataSet.remove.mockRejectedValue(new Error('Cleanup failed'))

    await usingAsync(injector, async (i) => {
      try {
        await RegisterAction({
          injector: i,
          getBody: async () => ({ username: 'newuser', password: 'password123' }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect((error as RequestError).responseCode).toBe(400)
        expect(mockUserDataSet.remove).toHaveBeenCalledWith(i, 'newuser')
      }
    })
  })
})
