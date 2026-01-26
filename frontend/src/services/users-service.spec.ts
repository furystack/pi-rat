import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { User } from 'common'
import { describe, expect, it, vi } from 'vitest'
import { createMockUser } from '../test-utils/user-test-helpers.js'
import { UsersService } from './users-service.js'
import { IdentityApiClient } from './api-clients/identity-api-client.js'

describe('UsersService', () => {
  const createTestInjector = (mockCall: ReturnType<typeof vi.fn>) => {
    const injector = new Injector()
    injector.setExplicitInstance(
      {
        call: mockCall,
      } as unknown as IdentityApiClient,
      IdentityApiClient,
    )
    return injector
  }

  describe('getUser', () => {
    it('should fetch a user by username', async () => {
      const mockUser = createMockUser()
      const mockCall = vi.fn().mockResolvedValue({ result: mockUser })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        const result = await service.getUser('testuser@example.com')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/users/:id',
          url: { id: 'testuser@example.com' },
          query: {},
        })
        expect(result).toEqual(mockUser)
      })
    })

    it('should cache user results', async () => {
      const mockUser = createMockUser()
      const mockCall = vi.fn().mockResolvedValue({ result: mockUser })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        await service.getUser('testuser@example.com')
        await service.getUser('testuser@example.com')

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle API errors (404)', async () => {
      const mockCall = vi.fn().mockRejectedValue(new Error('User not found'))
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        await expect(service.getUser('nonexistent@example.com')).rejects.toThrow('User not found')
      })
    })

    it('should handle server errors (500)', async () => {
      const mockCall = vi.fn().mockRejectedValue(new Error('Internal server error'))
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        await expect(service.getUser('testuser@example.com')).rejects.toThrow('Internal server error')
      })
    })
  })

  describe('getUserAsObservable', () => {
    it('should return an observable for user', async () => {
      const mockUser = createMockUser()
      const mockCall = vi.fn().mockResolvedValue({ result: mockUser })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        const observable = service.getUserAsObservable('testuser@example.com')

        expect(observable).toBeDefined()
        expect(observable.getValue().status).toBe('uninitialized')
      })
    })

    it('should share the same observable for the same username', async () => {
      const mockUser = createMockUser()
      const mockCall = vi.fn().mockResolvedValue({ result: mockUser })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        const observable1 = service.getUserAsObservable('testuser@example.com')
        const observable2 = service.getUserAsObservable('testuser@example.com')

        expect(observable1).toBe(observable2)
      })
    })
  })

  describe('findUsers', () => {
    it('should find users with query options', async () => {
      const mockUsers = {
        count: 2,
        entries: [createMockUser('user1@example.com'), createMockUser('user2@example.com')],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockUsers })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        const findOptions = { top: 10 }
        const result = await service.findUsers(findOptions)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'GET',
          action: '/users',
          query: {
            findOptions,
          },
        })
        expect(result).toEqual(mockUsers)
      })
    })

    it('should cache query results', async () => {
      const mockUsers = {
        count: 1,
        entries: [createMockUser()],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockUsers })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        const findOptions = { top: 10 }
        await service.findUsers(findOptions)
        await service.findUsers(findOptions)

        expect(mockCall).toHaveBeenCalledTimes(1)
      })
    })

    it('should pre-populate individual user cache from query results', async () => {
      const user1 = createMockUser('user1@example.com')
      const user2 = createMockUser('user2@example.com')
      const mockUsers = {
        count: 2,
        entries: [user1, user2],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockUsers })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        await service.findUsers({ top: 10 })

        const result = await service.getUser('user1@example.com')

        expect(mockCall).toHaveBeenCalledTimes(1)
        expect(result).toEqual(user1)
      })
    })
  })

  describe('findUsersAsObservable', () => {
    it('should return an observable for user query', async () => {
      const mockUsers = {
        count: 1,
        entries: [createMockUser()],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockUsers })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        const observable = service.findUsersAsObservable({ top: 10 })

        expect(observable).toBeDefined()
        expect(observable.getValue().status).toBe('uninitialized')
      })
    })

    it('should share the same observable for the same query options', async () => {
      const mockUsers = {
        count: 1,
        entries: [createMockUser()],
      }
      const mockCall = vi.fn().mockResolvedValue({ result: mockUsers })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        const findOptions = { top: 10 }
        const observable1 = service.findUsersAsObservable(findOptions)
        const observable2 = service.findUsersAsObservable(findOptions)

        expect(observable1).toBe(observable2)
      })
    })
  })

  describe('updateUser', () => {
    it('should update user roles', async () => {
      const updatedUser = createMockUser('testuser@example.com', ['admin', 'viewer'])
      const reloadedUser = createMockUser('testuser@example.com', ['admin', 'viewer'])
      const mockCall = vi
        .fn()
        .mockResolvedValueOnce({ result: updatedUser }) // 1st: updateUser PATCH
        .mockResolvedValueOnce({ result: reloadedUser }) // 2nd: reload triggered by updateUser
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        const body = {
          username: 'testuser@example.com',
          roles: ['admin', 'viewer'] as User['roles'],
        }
        const result = await service.updateUser('testuser@example.com', body)

        expect(mockCall).toHaveBeenCalledWith({
          method: 'PATCH',
          action: '/users/:id',
          url: { id: 'testuser@example.com' },
          body,
        })
        expect(result).toEqual(updatedUser)

        // Wait for the async reload triggered by updateUser to complete
        await vi.waitFor(() => {
          expect(mockCall).toHaveBeenCalledTimes(2)
        })
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
    })

    it('should invalidate cache after update', async () => {
      const originalUser = createMockUser('testuser@example.com', ['admin'])
      const updatedUser = createMockUser('testuser@example.com', ['admin', 'viewer'])
      const reloadedUser = createMockUser('testuser@example.com', ['admin', 'viewer'])
      const mockCall = vi
        .fn()
        .mockResolvedValueOnce({ result: originalUser }) // 1st: initial getUser
        .mockResolvedValueOnce({ result: updatedUser }) // 2nd: updateUser PATCH
        .mockResolvedValueOnce({ result: reloadedUser }) // 3rd: reload triggered by updateUser
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        await service.getUser('testuser@example.com')

        const body = {
          username: 'testuser@example.com',
          roles: ['admin', 'viewer'] as User['roles'],
        }
        await service.updateUser('testuser@example.com', body)

        // Wait for the async reload triggered by updateUser to complete
        await vi.waitFor(() => {
          expect(mockCall).toHaveBeenCalledTimes(3)
        })
        // Flush pending microtasks to ensure reload fully completes
        await new Promise((resolve) => setTimeout(resolve, 0))

        // The reload already populated the cache with fresh data
        const result = await service.getUser('testuser@example.com')

        // No additional API call needed - data comes from reload cache
        expect(mockCall).toHaveBeenCalledTimes(3)
        expect(result).toEqual(reloadedUser)
      })
    })

    it('should flush query cache after update', async () => {
      const mockUsers = {
        count: 1,
        entries: [createMockUser('testuser@example.com', ['admin'])],
      }
      const updatedUser = createMockUser('testuser@example.com', ['admin', 'viewer'])
      const reloadedUser = createMockUser('testuser@example.com', ['admin', 'viewer'])
      const updatedMockUsers = {
        count: 1,
        entries: [updatedUser],
      }
      const mockCall = vi
        .fn()
        .mockResolvedValueOnce({ result: mockUsers }) // 1st: findUsers
        .mockResolvedValueOnce({ result: updatedUser }) // 2nd: updateUser PATCH
        .mockResolvedValueOnce({ result: reloadedUser }) // 3rd: reload triggered by updateUser
        .mockResolvedValueOnce({ result: updatedMockUsers }) // 4th: findUsers after flush
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        await service.findUsers({ top: 10 })

        await service.updateUser('testuser@example.com', {
          username: 'testuser@example.com',
          roles: ['admin', 'viewer'],
        })

        // Wait for the async reload triggered by updateUser to complete
        await vi.waitFor(() => {
          expect(mockCall).toHaveBeenCalledTimes(3)
        })
        // Flush pending microtasks to ensure reload fully completes
        await new Promise((resolve) => setTimeout(resolve, 0))

        await service.findUsers({ top: 10 })

        expect(mockCall).toHaveBeenCalledTimes(4)
      })
    })

    it('should handle validation errors (400)', async () => {
      const mockCall = vi.fn().mockRejectedValue(new Error('Invalid user data'))
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        await expect(
          service.updateUser('testuser@example.com', {
            username: 'testuser@example.com',
            roles: [],
          }),
        ).rejects.toThrow('Invalid user data')
      })
    })

    it('should handle server errors (500)', async () => {
      const mockCall = vi.fn().mockRejectedValue(new Error('Internal server error'))
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        await expect(
          service.updateUser('testuser@example.com', {
            username: 'testuser@example.com',
            roles: ['admin'],
          }),
        ).rejects.toThrow('Internal server error')
      })
    })
  })

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const mockCall = vi.fn().mockResolvedValue({})
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        await service.deleteUser('testuser@example.com')

        expect(mockCall).toHaveBeenCalledWith({
          method: 'DELETE',
          action: '/users/:id',
          url: { id: 'testuser@example.com' },
        })
      })
    })

    it('should remove user from cache after delete', async () => {
      const mockUser = createMockUser()
      const mockCall = vi
        .fn()
        .mockResolvedValueOnce({ result: mockUser })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ result: mockUser })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        await service.getUser('testuser@example.com')

        await service.deleteUser('testuser@example.com')

        await service.getUser('testuser@example.com')

        expect(mockCall).toHaveBeenCalledTimes(3)
      })
    })

    it('should flush query cache after delete', async () => {
      const mockUsers = {
        count: 1,
        entries: [createMockUser()],
      }
      const emptyMockUsers = {
        count: 0,
        entries: [],
      }
      const mockCall = vi
        .fn()
        .mockResolvedValueOnce({ result: mockUsers })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ result: emptyMockUsers })
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        await service.findUsers({ top: 10 })

        await service.deleteUser('testuser@example.com')

        await service.findUsers({ top: 10 })

        expect(mockCall).toHaveBeenCalledTimes(3)
      })
    })

    it('should handle not found errors (404)', async () => {
      const mockCall = vi.fn().mockRejectedValue(new Error('User not found'))
      const injector = createTestInjector(mockCall)

      await usingAsync(injector, async (i) => {
        const service = i.getInstance(UsersService)

        await expect(service.deleteUser('nonexistent@example.com')).rejects.toThrow('User not found')
      })
    })
  })
})
