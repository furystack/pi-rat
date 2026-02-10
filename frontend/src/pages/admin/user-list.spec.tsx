import { Injector } from '@furystack/inject'
import { LocationService, createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import type { User } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UsersService } from '../../services/users-service.js'
import { type CacheState, createMockUser } from '../../test-utils/user-test-helpers.js'
import { UserListPage } from './user-list.js'

describe('UserListPage', () => {
  let injector: Injector
  let mockUsersService: {
    findUsersAsObservable: ReturnType<typeof vi.fn>
    findUsers: ReturnType<typeof vi.fn>
    userQueryCache: { flushAll: ReturnType<typeof vi.fn> }
  }
  let usersObservable: ObservableValue<CacheState<{ count: number; entries: User[] }>>

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    usersObservable = new ObservableValue<CacheState<{ count: number; entries: User[] }>>({
      status: 'loaded',
      value: {
        count: 2,
        entries: [createMockUser('user1@example.com', ['admin']), createMockUser('user2@example.com', ['viewer'])],
      },
      updatedAt: new Date(),
    })

    mockUsersService = {
      findUsersAsObservable: vi.fn().mockReturnValue(usersObservable),
      findUsers: vi.fn().mockResolvedValue({
        count: 2,
        entries: [createMockUser('user1@example.com', ['admin']), createMockUser('user2@example.com', ['viewer'])],
      }),
      userQueryCache: { flushAll: vi.fn() },
    }

    injector = new Injector()
    injector.setExplicitInstance(mockUsersService as unknown as UsersService, UsersService)
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
      expect(page?.textContent).toContain('👥 Users')
      expect(page?.textContent).toContain('Manage user accounts and their roles.')
    })

    it('should display loading state', async () => {
      usersObservable.setValue({ status: 'loading' })

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()

      const page = document.querySelector('user-list-page')
      expect(page?.textContent).toContain('Loading users...')
    })

    it('should display uninitialized state as loading', async () => {
      usersObservable.setValue({ status: 'uninitialized' })

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()

      const page = document.querySelector('user-list-page')
      expect(page?.textContent).toContain('Loading users...')
    })

    it('should display error state with retry button', async () => {
      usersObservable.setValue({
        status: 'failed',
        error: new Error('Network error'),
        updatedAt: new Date(),
      })

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()

      const page = document.querySelector('user-list-page')
      expect(page?.textContent).toContain('Error: Network error')

      // Button component renders a button element with content in shadow DOM
      const retryButton = page?.querySelector('button')
      expect(retryButton).toBeTruthy()
    })

    it('should display error message for non-Error objects', async () => {
      usersObservable.setValue({
        status: 'failed',
        error: 'string error',
        updatedAt: new Date(),
      })

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()

      const page = document.querySelector('user-list-page')
      expect(page?.textContent).toContain('Failed to load users')
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

      expect(roleTags?.length).toBe(2) // One for admin, one for viewer
    })

    it('should display "No roles" message for user without roles', async () => {
      usersObservable.setValue({
        status: 'loaded',
        value: {
          count: 1,
          entries: [createMockUser('noRoles@example.com', [])],
        },
        updatedAt: new Date(),
      })

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
      usersObservable.setValue({
        status: 'loaded',
        value: {
          count: 0,
          entries: [],
        },
        updatedAt: new Date(),
      })

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
      // Button component renders button elements within table rows
      const editButtons = page?.querySelectorAll('tbody button')

      expect(editButtons?.length).toBe(2)
      // Verify buttons exist (content is in shadow DOM)
      expect(editButtons?.[0]).toBeTruthy()
      expect(editButtons?.[1]).toBeTruthy()
    })
  })

  describe('navigation', () => {
    it('should navigate to user details when Edit button is clicked', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const locationService = injector.getInstance(LocationService)
      const updateStateSpy = vi.spyOn(locationService, 'updateState')

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
      expect(updateStateSpy).toHaveBeenCalled()
    })

    it('should navigate to user details when table row is clicked', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const locationService = injector.getInstance(LocationService)
      const updateStateSpy = vi.spyOn(locationService, 'updateState')

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
      expect(updateStateSpy).toHaveBeenCalled()
    })

    it('should encode username in URL to handle special characters', async () => {
      usersObservable.setValue({
        status: 'loaded',
        value: {
          count: 1,
          entries: [createMockUser('user+special@example.com', ['admin'])],
        },
        updatedAt: new Date(),
      })

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

  describe('retry functionality', () => {
    it('should flush cache and refetch when retry is clicked', async () => {
      usersObservable.setValue({
        status: 'failed',
        error: new Error('Network error'),
        updatedAt: new Date(),
      })

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()

      const page = document.querySelector('user-list-page')
      const retryButton = page?.querySelector('button') as HTMLButtonElement
      retryButton.click()

      expect(mockUsersService.userQueryCache.flushAll).toHaveBeenCalled()
      expect(mockUsersService.findUsers).toHaveBeenCalledWith({})
    })
  })

  describe('service integration', () => {
    it('should call findUsersAsObservable on render', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserListPage />,
      })
      await flushUpdates()

      expect(mockUsersService.findUsersAsObservable).toHaveBeenCalledWith({})
    })
  })
})
