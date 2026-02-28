import { Cache } from '@furystack/cache'
import { Injector } from '@furystack/inject'
import { LocationService, createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { NotyService } from '@furystack/shades-common-components'
import type { User } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UsersService } from '../../services/users-service.js'
import { createMockUser } from '../../test-utils/user-test-helpers.js'
import { UserDetailsPage } from './user-details.js'

/**
 * Helper to get action buttons (excluding buttons inside role-tags and shade-select)
 */
const getActionButtons = (page: Element | null | undefined) => {
  const allButtons = Array.from(page?.querySelectorAll('button') ?? [])
  return allButtons.filter((btn) => !btn.closest('role-tag') && !btn.closest('shade-select'))
}

/**
 * Helper to select a role from the Select dropdown by clicking the combobox trigger
 * then clicking the matching option item by its display label.
 */
const ROLE_LABELS: Record<string, string> = {
  admin: 'Application Admin',
  viewer: 'Viewer',
  'media-manager': 'Media Manager',
  'iot-manager': 'IoT Manager',
}

const selectRoleFromDropdown = async (page: Element | null | undefined, roleName: string) => {
  const select = page?.querySelector('shade-select')
  const trigger = select?.querySelector('[role="combobox"]') as HTMLElement
  trigger?.click()
  await flushUpdates()
  const label = ROLE_LABELS[roleName] ?? roleName
  const options = Array.from(select?.querySelectorAll('[role="option"]') ?? [])
  const option = options.find((opt) => opt.textContent?.includes(label)) as HTMLElement
  option?.click()
  await flushUpdates()
}

describe('UserDetailsPage', () => {
  let injector: Injector
  let mockUsersService: {
    userCache: Cache<User, [string]>
    updateUser: ReturnType<typeof vi.fn>
  }
  let mockNotyService: {
    emit: ReturnType<typeof vi.fn>
  }

  const seedUserCache = (username: string, roles: User['roles']) => {
    mockUsersService.userCache.setExplicitValue({
      loadArgs: [username],
      value: { status: 'loaded', value: createMockUser(username, roles), updatedAt: new Date() },
    })
  }

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    const userCache = new Cache<User, [string]>({
      capacity: 10,
      load: vi.fn().mockResolvedValue(createMockUser('testuser@example.com', ['admin'])),
    })

    userCache.setExplicitValue({
      loadArgs: ['testuser@example.com'],
      value: { status: 'loaded', value: createMockUser('testuser@example.com', ['admin']), updatedAt: new Date() },
    })

    mockUsersService = {
      userCache,
      updateUser: vi.fn().mockResolvedValue(createMockUser('testuser@example.com', ['admin', 'viewer'])),
    }

    mockNotyService = {
      emit: vi.fn(),
    }

    injector = new Injector()
    injector.setExplicitInstance(mockUsersService as unknown as UsersService, UsersService)
    injector.setExplicitInstance(mockNotyService as unknown as NotyService, NotyService)
  })

  afterEach(async () => {
    await injector[Symbol.asyncDispose]()
    document.body.innerHTML = ''
  })

  describe('rendering', () => {
    it('should render the user details page with header', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')
      expect(page).toBeTruthy()
      expect(page?.textContent).toContain('User Details')
    })

    it('should display loader when loading', async () => {
      const neverResolvingCache = new Cache<User, [string]>({
        capacity: 10,
        load: () => new Promise(() => {}),
      })
      mockUsersService.userCache = neverResolvingCache

      injector.setExplicitInstance(mockUsersService as unknown as UsersService, UsersService)

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')
      const skeleton = page?.querySelector('shade-skeleton')
      expect(skeleton).toBeTruthy()
    })

    it('should display error state', async () => {
      mockUsersService.userCache.setExplicitValue({
        loadArgs: ['nonexistent@example.com'],
        value: { status: 'failed', error: new Error('User not found'), updatedAt: new Date() },
      })

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="nonexistent@example.com" />,
      })
      await flushUpdates()
      await flushUpdates()

      const page = document.querySelector('user-details-page')
      expect(page?.textContent).toContain('User not found')
    })
  })

  describe('user information display', () => {
    it('should display username', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')
      expect(page?.textContent).toContain('Username:')
      expect(page?.textContent).toContain('testuser@example.com')
    })

    it('should display created date', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')
      expect(page?.textContent).toContain('Created:')
    })

    it('should display last updated date', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')
      expect(page?.textContent).toContain('Last Updated:')
    })
  })

  describe('roles section', () => {
    it('should display roles section header', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')
      expect(page?.textContent).toContain('Roles')
    })

    it('should render role tags for user roles', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')
      const roleTags = page?.querySelectorAll('role-tag')

      expect(roleTags?.length).toBe(1)
    })

    it('should render multiple role tags for user with multiple roles', async () => {
      seedUserCache('testuser@example.com', ['admin', 'viewer', 'media-manager'])

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')
      const roleTags = page?.querySelectorAll('role-tag')

      expect(roleTags?.length).toBe(3)
    })

    it('should display "No roles assigned" for user without roles', async () => {
      seedUserCache('testuser@example.com', [])

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')
      expect(page?.textContent).toContain('No roles assigned')
    })
  })

  describe('add role dropdown', () => {
    it('should display Add Role dropdown', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')
      expect(page?.textContent).toContain('Add Role')

      const select = page?.querySelector('shade-select')
      expect(select).toBeTruthy()
    })

    it('should show available roles that user does not have', async () => {
      seedUserCache('testuser@example.com', ['admin'])

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')
      const select = page?.querySelector('shade-select')
      expect(select).toBeTruthy()

      // Open the dropdown by clicking the combobox trigger
      const trigger = select?.querySelector('[role="combobox"]') as HTMLElement
      trigger?.click()
      await flushUpdates()

      // Check that the available roles are rendered (not admin since user already has it)
      const selectText = select?.textContent ?? ''
      expect(selectText).toContain('Viewer')
      expect(selectText).toContain('Media Manager')
      expect(selectText).toContain('IoT Manager')
      expect(selectText).not.toContain('Application Admin')
    })

    it('should not show dropdown when user has all roles', async () => {
      seedUserCache('testuser@example.com', ['admin', 'viewer', 'media-manager', 'iot-manager'])

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')
      const select = page?.querySelector('shade-select')
      expect(select).toBeFalsy()
    })
  })

  describe('action buttons', () => {
    it('should render action buttons', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')
      // Back button, Save Changes button, and Cancel button
      const buttons = page?.querySelectorAll('button')
      expect(buttons?.length).toBeGreaterThanOrEqual(3)
    })

    it('should have Save Changes and Cancel buttons disabled when no changes', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')
      const disabledButtons = page?.querySelectorAll('button[disabled]')
      expect(disabledButtons?.length).toBe(2)
    })
  })

  describe('navigation', () => {
    it('should navigate back to user list when Back button is clicked', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const locationService = injector.getInstance(LocationService)
      const updateStateSpy = vi.spyOn(locationService, 'updateState')

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')
      const backButton = page?.querySelector('button') as HTMLButtonElement

      backButton.click()

      expect(window.location.pathname).toBe('/app-settings/users')
      expect(updateStateSpy).toHaveBeenCalled()
    })
  })

  describe('role editing', () => {
    it('should add role when selected from dropdown', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')

      await selectRoleFromDropdown(page, 'viewer')

      const roleTags = page?.querySelectorAll('role-tag')
      expect(roleTags?.length).toBe(2)

      const actionButtons = getActionButtons(page)
      const disabledActionButtons = actionButtons.filter((btn) => btn.disabled)
      expect(disabledActionButtons.length).toBe(0)
    })

    it('should remove role when remove button is clicked', async () => {
      seedUserCache('testuser@example.com', ['admin', 'viewer'])

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()
      await flushUpdates()

      const page = document.querySelector('user-details-page')

      const roleTag = page?.querySelector('role-tag')
      const removeButton = roleTag?.querySelector('button')
      removeButton?.click()

      await new Promise((resolve) => setTimeout(resolve, 10))
      await flushUpdates()
      await flushUpdates()

      const disabledButtons = page?.querySelectorAll('button[disabled]')
      expect(disabledButtons?.length).toBe(0)
    })

    it('should cancel changes when Cancel button is clicked', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')

      await selectRoleFromDropdown(page, 'viewer')

      await new Promise((resolve) => setTimeout(resolve, 10))

      const actionButtons = getActionButtons(page)
      const cancelButton = actionButtons[actionButtons.length - 1]
      cancelButton.click()

      await new Promise((resolve) => setTimeout(resolve, 10))

      const roleTags = page?.querySelectorAll('role-tag')
      expect(roleTags?.length).toBe(1)

      const disabledActionButtons = getActionButtons(page).filter((btn) => btn.disabled)
      expect(disabledActionButtons.length).toBe(2)
    })
  })

  describe('save functionality', () => {
    it('should call updateUser when Save Changes is clicked', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')

      await selectRoleFromDropdown(page, 'viewer')

      await new Promise((resolve) => setTimeout(resolve, 10))

      const actionButtons = getActionButtons(page)
      const saveButton = actionButtons[1]
      saveButton.click()

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockUsersService.updateUser).toHaveBeenCalledWith('testuser@example.com', {
        username: 'testuser@example.com',
        roles: ['admin', 'viewer'],
      })
    })

    it('should show success notification after save', async () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')

      await selectRoleFromDropdown(page, 'viewer')

      await new Promise((resolve) => setTimeout(resolve, 10))

      const actionButtons = getActionButtons(page)
      const saveButton = actionButtons[1]
      saveButton.click()

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockNotyService.emit).toHaveBeenCalledWith('onNotyAdded', {
        title: 'Success',
        body: 'User roles updated successfully',
        type: 'success',
      })
    })

    it('should show error notification on save failure', async () => {
      mockUsersService.updateUser.mockRejectedValueOnce(new Error('Network error'))

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')

      await selectRoleFromDropdown(page, 'viewer')

      await new Promise((resolve) => setTimeout(resolve, 10))

      const actionButtons = getActionButtons(page)
      const saveButton = actionButtons[1]
      saveButton.click()

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockNotyService.emit).toHaveBeenCalledWith('onNotyAdded', {
        title: 'Error',
        body: 'Network error',
        type: 'error',
      })
    })

    it('should disable buttons while saving', async () => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      mockUsersService.updateUser.mockImplementation(() => {
        return new Promise<User>((resolve) => {
          setTimeout(() => {
            resolve(createMockUser())
          }, 100)
        })
      })

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()

      const page = document.querySelector('user-details-page')

      await selectRoleFromDropdown(page, 'viewer')

      await new Promise((resolve) => setTimeout(resolve, 10))

      const actionButtonsBefore = getActionButtons(page)
      expect(actionButtonsBefore[1]?.disabled).toBe(false)
      expect(actionButtonsBefore[2]?.disabled).toBe(false)

      actionButtonsBefore[1]?.click()

      await new Promise((resolve) => setTimeout(resolve, 10))

      const actionButtonsAfter = getActionButtons(page)
      expect(actionButtonsAfter[1]?.disabled).toBe(true)
      expect(actionButtonsAfter[2]?.disabled).toBe(true)
    })
  })

  describe('validation', () => {
    it('should show validation error when trying to save with no roles', async () => {
      seedUserCache('testuser@example.com', ['viewer'])

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })
      await flushUpdates()
      await flushUpdates()

      const page = document.querySelector('user-details-page')

      const roleTag = page?.querySelector('role-tag')
      const removeButton = roleTag?.querySelector('button')
      removeButton?.click()

      await new Promise((resolve) => setTimeout(resolve, 10))
      await flushUpdates()
      await flushUpdates()

      const actionButtons = getActionButtons(page)
      const saveButton = actionButtons[1]
      saveButton.click()

      await new Promise((resolve) => setTimeout(resolve, 10))
      await flushUpdates()
      await flushUpdates()

      expect(page?.textContent).toContain('User must have at least one role')
      expect(mockUsersService.updateUser).not.toHaveBeenCalled()
    })
  })
})
