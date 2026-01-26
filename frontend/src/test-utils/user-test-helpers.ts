import type { User } from 'common'

/**
 * Cache state type for testing observable cache values
 */
export type CacheState<T> =
  | { status: 'uninitialized' }
  | { status: 'loading' }
  | { status: 'obsolete'; value: T; updatedAt: Date }
  | { status: 'loaded'; value: T; updatedAt: Date }
  | { status: 'failed'; error: unknown; updatedAt: Date }

/**
 * Factory function to create mock User objects for testing
 */
export const createMockUser = (
  username = 'testuser@example.com',
  roles: User['roles'] = ['admin'],
  options?: {
    createdAt?: string
    updatedAt?: string
  },
): User => ({
  username,
  roles,
  createdAt: options?.createdAt ?? new Date().toISOString(),
  updatedAt: options?.updatedAt ?? new Date().toISOString(),
})
