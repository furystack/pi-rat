import { Cache } from '@furystack/cache'
import type { GetCollectionResult } from '@furystack/rest'
import { Injector } from '@furystack/inject'
import { LocationService, createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import type { User } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UsersService } from '../../services/users-service.js'
import { createMockUser } from '../../test-utils/user-test-helpers.js'
import { UserListPage } from './user-list.js'

describe('UserListPage', () => {
  let injector: Injector
  let mockUsersService: {
    userQueryCache: Cache<GetCollectionResult<User>, [Record<string, unknown>]>
  }

  const defaultUsers = [createMockUser('user1@example.com', ['admin']), createMockUser('user2@example.com', ['viewer'])]

  const seedUsersCache = (entries: User[], count?: number) => {
    mockUsersService.userQueryCache.setExplicitValue({
      loadArgs: [{}],
      value: {
        status: 'loaded',
        value: { count: count ?? entries.length, entries },
        updatedAt: new Date(),
      },
    })
  }

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    const userQueryCache = new Cache<GetCollectionResult<User>, [Record<string, unknown>]>({
      capacity: 10,
      load: vi.fn().mockResolvedValue({ count: 2, entries: defaultUsers }),
    })

    userQueryCache.setExplicitValue({
      loadArgs: [{}],
      value: { status: 'loaded', value: { count: 2, entries: defaultUsers }, updatedAt: new Date() },
    })

    mockUsersService = {
      userQueryCache,
    }

    injector = new Injector()
    injector.bind(UsersService, () => mockUsersService as never)
  })

  afterEach(async () => {
    await injector[Symbol.asyncDispose]()
    document.body.innerHTML = ''
  })

  describe('rendering', () => {
    it('should render the user list page with header', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()

      const page = document.querySelector('user-list-page')
      expect(page).toBeTruthy()
      expect(page?.textContent).toContain('Users')
      expect(page?.textContent).toContain('Manage user accounts and their roles.')
    })

    it('should display loader when loading', async () => {
      const neverResolvingCache = new Cache<GetCollectionResult<User>, [Record<string, unknown>]>({
        capacity: 10,
        load: () => new Promise(() => {}),
      })
      mockUsersService.userQueryCache = neverResolvingCache

      injector.bind(UsersService, () => mockUsersService as never)

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()

      const page = document.querySelector('user-list-page')
      const skeleton = page?.querySelector('shade-skeleton')
      expect(skeleton).toBeTruthy()
    })

    it('should display error state', async () => {
      mockUsersService.userQueryCache.setExplicitValue({
        loadArgs: [{}],
        value: { status: 'failed', error: new Error('Network error'), updatedAt: new Date() },
      })

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()
      await flushUpdates()

      const page = document.querySelector('user-list-page')
      expect(page?.textContent).toContain('Network error')
    })
  })

  describe('table display', () => {
    it('should render table with headers', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()

      const page = document.querySelector('user-list-page')
      const headers = page?.querySelectorAll('th')

      expect(headers?.length).toBe(4)
      expect(headers?.[0]?.textContent).toContain('Username')
      expect(headers?.[1]?.textContent).toContain('Roles')
      expect(headers?.[2]?.textContent).toContain('Created')
      expect(headers?.[3]?.textContent).toContain('Actions')
    })

    it('should render users in table rows', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()

      const page = document.querySelector('user-list-page')
      const rows = page?.querySelectorAll('tbody tr')

      expect(rows?.length).toBe(2)
      expect(rows?.[0]?.textContent).toContain('user1@example.com')
      expect(rows?.[1]?.textContent).toContain('user2@example.com')
    })

    it('should render role tags for each user', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()

      const page = document.querySelector('user-list-page')
      const roleTags = page?.querySelectorAll('role-tag')

      expect(roleTags?.length).toBe(2)
    })

    it('should display "No roles" message for user without roles', async () => {
      seedUsersCache([createMockUser('noRoles@example.com', [])])

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()

      const page = document.querySelector('user-list-page')
      expect(page?.textContent).toContain('No roles')
    })

    it('should display empty state when no users exist', async () => {
      seedUsersCache([], 0)

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()

      const page = document.querySelector('user-list-page')
      expect(page?.textContent).toContain('No users found.')
    })

    it('should render Edit button for each user', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()

      const page = document.querySelector('user-list-page')
      const editButtons = page?.querySelectorAll('tbody button')

      expect(editButtons?.length).toBe(2)
      expect(editButtons?.[0]).toBeTruthy()
      expect(editButtons?.[1]).toBeTruthy()
    })
  })

  describe('navigation', () => {
    it('should navigate to user details when Edit button is clicked', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const locationService = injector.get(LocationService)
      const navigateSpy = vi.spyOn(locationService, 'navigate')

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()

      const page = document.querySelector('user-list-page')
      const editButton = page?.querySelector('tbody button') as HTMLButtonElement
      editButton.click()

      expect(window.location.pathname).toBe('/app-settings/users/user1%40example.com')
      expect(navigateSpy).toHaveBeenCalledWith('/app-settings/users/user1%40example.com')
    })

    it('should navigate to user details when table row is clicked', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const locationService = injector.get(LocationService)
      const navigateSpy = vi.spyOn(locationService, 'navigate')

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()

      const page = document.querySelector('user-list-page')
      const row = page?.querySelector('tbody tr') as HTMLTableRowElement
      row.click()

      expect(window.location.pathname).toBe('/app-settings/users/user1%40example.com')
      expect(navigateSpy).toHaveBeenCalledWith('/app-settings/users/user1%40example.com')
    })

    it('should encode username in URL to handle special characters', async () => {
      seedUsersCache([createMockUser('user+special@example.com', ['admin'])])

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()

      const page = document.querySelector('user-list-page')
      const row = page?.querySelector('tbody tr') as HTMLTableRowElement
      row.click()

      expect(window.location.pathname).toBe('/app-settings/users/user%2Bspecial%40example.com')
    })
  })
})
