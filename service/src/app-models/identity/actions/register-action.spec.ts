import type { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { StoreManager } from '@furystack/core'
import { RequestError } from '@furystack/rest'
import { HttpUserContext } from '@furystack/rest-service'
import { PasswordAuthenticator, PasswordCredential } from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { User } from 'common'
import { RegisterAction } from './register-action.js'

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

describe('RegisterAction', () => {
  const createTestInjector = () => {
    const injector = new Injector()

    const mockUserStore = {
      get: vi.fn(),
      add: vi.fn(),
      remove: vi.fn(),
    }

    const mockCredentialStore = {
      add: vi.fn(),
    }

    const mockStoreManager = {
      getStoreFor: vi.fn((model: { name: string }) => {
        if (model === User || model.name === 'User') return mockUserStore
        if (model === PasswordCredential || model.name === 'PasswordCredential') return mockCredentialStore
        throw new Error(`Unknown model: ${model.name}`)
      }),
    }

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

    injector.setExplicitInstance(mockStoreManager as unknown as StoreManager, StoreManager)
    injector.setExplicitInstance(mockAuthenticator as unknown as PasswordAuthenticator, PasswordAuthenticator)
    injector.setExplicitInstance(mockUserContext as unknown as HttpUserContext, HttpUserContext)

    return { injector, mockUserStore, mockCredentialStore, mockHasher, mockUserContext }
  }

  it('should register a new user successfully', async () => {
    const { injector, mockUserStore, mockCredentialStore, mockUserContext } = createTestInjector()

    mockUserStore.get.mockResolvedValue(null) // User doesn't exist
    mockUserStore.add.mockResolvedValue(undefined)
    mockCredentialStore.add.mockResolvedValue(undefined)

    await usingAsync(injector, async (i) => {
      const result = await RegisterAction({
        injector: i,
        getBody: async () => ({ username: 'newuser', password: 'password123' }),
        response: {} as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(mockUserStore.get).toHaveBeenCalledWith('newuser')
      expect(mockUserStore.add).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'newuser',
          roles: [],
        }),
      )
      expect(mockCredentialStore.add).toHaveBeenCalled()
      expect(mockUserContext.authenticateUser).toHaveBeenCalledWith('newuser', 'password123')
      expect(mockUserContext.cookieLogin).toHaveBeenCalled()
      expect(result.chunk).toEqual({ username: 'newuser', roles: [] })
    })
  })

  it('should throw 409 when user already exists', async () => {
    const { injector, mockUserStore } = createTestInjector()

    mockUserStore.get.mockResolvedValue({ username: 'existinguser', roles: [] })

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
    const { injector, mockUserStore, mockHasher } = createTestInjector()

    mockUserStore.get.mockResolvedValue(null)
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
    const { injector, mockUserStore, mockCredentialStore } = createTestInjector()

    mockUserStore.get.mockResolvedValue(null)
    mockUserStore.add.mockResolvedValue(undefined)
    mockCredentialStore.add.mockRejectedValue(new Error('Credential store error'))
    mockUserStore.remove.mockResolvedValue(undefined)

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
        // Verify cleanup was attempted
        expect(mockUserStore.remove).toHaveBeenCalledWith('newuser')
      }
    })
  })

  it('should not fail if cleanup fails', async () => {
    const { injector, mockUserStore, mockCredentialStore } = createTestInjector()

    mockUserStore.get.mockResolvedValue(null)
    mockUserStore.add.mockResolvedValue(undefined)
    mockCredentialStore.add.mockRejectedValue(new Error('Credential store error'))
    mockUserStore.remove.mockRejectedValue(new Error('Cleanup failed'))

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
        // Cleanup was attempted even though it failed
        expect(mockUserStore.remove).toHaveBeenCalledWith('newuser')
      }
    })
  })
})
