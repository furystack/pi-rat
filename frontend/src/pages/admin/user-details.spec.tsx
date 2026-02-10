import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot, LocationService } from '@furystack/shades'
import { NotyService } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { User } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UsersService } from '../../services/users-service.js'
import { type CacheState, createMockUser } from '../../test-utils/user-test-helpers.js'
import { UserDetailsPage } from './user-details.js'

/**
 * Helper to get action buttons (excluding buttons inside role-tags)
 */
const getActionButtons = (page: Element | null | undefined) => {
  const allButtons = Array.from(page?.querySelectorAll('button') ?? [])
  // Filter out buttons that are inside role-tag elements
  return allButtons.filter((btn) => !btn.closest('role-tag'))
}

describe('UserDetailsPage', () => {
  let injector: Injector
  let mockUsersService: {
    getUserAsObservable: ReturnType<typeof vi.fn>
    updateUser: ReturnType<typeof vi.fn>
  }
  let mockNotyService: {
    emit: ReturnType<typeof vi.fn>
  }
  let userObservable: ObservableValue<CacheState<User>>

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    userObservable = new ObservableValue<CacheState<User>>({
      status: 'loaded',
      value: createMockUser('testuser@example.com', ['admin']),
      updatedAt: new Date(),
    })

    mockUsersService = {
      getUserAsObservable: vi.fn().mockReturnValue(userObservable),
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
    it('should render the user details page with header', () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      expect(page).toBeTruthy()
      expect(page?.textContent).toContain('User Details')
    })

    it('should display loading state', () => {
      userObservable.setValue({ status: 'loading' })

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      expect(page?.textContent).toContain('Loading user...')
    })

    it('should display error state with go back button', () => {
      userObservable.setValue({
        status: 'failed',
        error: new Error('User not found'),
        updatedAt: new Date(),
      })

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="nonexistent@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      expect(page?.textContent).toContain('Error: User not found')
      // Go Back button exists - Button component renders as button element
      const buttons = page?.querySelectorAll('button')
      // Should have Back button and Go Back button
      expect(buttons?.length).toBeGreaterThanOrEqual(1)
    })

    it('should display fallback error message for non-Error objects', () => {
      userObservable.setValue({
        status: 'failed',
        error: 'string error',
        updatedAt: new Date(),
      })

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      expect(page?.textContent).toContain('Failed to load user')
    })
  })

  describe('user information display', () => {
    it('should display username', () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      expect(page?.textContent).toContain('Username:')
      expect(page?.textContent).toContain('testuser@example.com')
    })

    it('should display created date', () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      expect(page?.textContent).toContain('Created:')
    })

    it('should display last updated date', () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      expect(page?.textContent).toContain('Last Updated:')
    })
  })

  describe('roles section', () => {
    it('should display roles section header', () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      expect(page?.textContent).toContain('Roles')
    })

    it('should render role tags for user roles', () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      const roleTags = page?.querySelectorAll('role-tag')

      expect(roleTags?.length).toBe(1)
    })

    it('should render multiple role tags for user with multiple roles', () => {
      userObservable.setValue({
        status: 'loaded',
        value: createMockUser('testuser@example.com', ['admin', 'viewer', 'media-manager']),
        updatedAt: new Date(),
      })

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      const roleTags = page?.querySelectorAll('role-tag')

      expect(roleTags?.length).toBe(3)
    })

    it('should display "No roles assigned" for user without roles', () => {
      userObservable.setValue({
        status: 'loaded',
        value: createMockUser('testuser@example.com', []),
        updatedAt: new Date(),
      })

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      expect(page?.textContent).toContain('No roles assigned')
    })
  })

  describe('add role dropdown', () => {
    it('should display Add Role dropdown', () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      expect(page?.textContent).toContain('Add Role:')

      const select = page?.querySelector('select')
      expect(select).toBeTruthy()
    })

    it('should show available roles that user does not have', () => {
      userObservable.setValue({
        status: 'loaded',
        value: createMockUser('testuser@example.com', ['admin']),
        updatedAt: new Date(),
      })

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      const select = page?.querySelector('select')
      const options = select?.querySelectorAll('option')

      // Should have placeholder + 3 available roles (viewer, media-manager, iot-manager)
      expect(options?.length).toBe(4)
      expect(select?.textContent).toContain('Select a role to add...')
      expect(select?.textContent).toContain('Viewer')
      expect(select?.textContent).toContain('Media Manager')
      expect(select?.textContent).toContain('IoT Manager')
      expect(select?.textContent).not.toContain('Application Admin')
    })

    it('should not show dropdown when user has all roles', () => {
      userObservable.setValue({
        status: 'loaded',
        value: createMockUser('testuser@example.com', ['admin', 'viewer', 'media-manager', 'iot-manager']),
        updatedAt: new Date(),
      })

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      const select = page?.querySelector('select')
      expect(select).toBeFalsy()
    })
  })

  describe('action buttons', () => {
    it('should render action buttons', () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      // Back button, Save Changes button, and Cancel button
      const buttons = page?.querySelectorAll('button')
      expect(buttons?.length).toBeGreaterThanOrEqual(3)
    })

    it('should have Save Changes and Cancel buttons disabled when no changes', () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      // Button component sets disabled attribute on the button element
      const disabledButtons = page?.querySelectorAll('button[disabled]')
      // Save and Cancel buttons should be disabled (Back is always enabled)
      expect(disabledButtons?.length).toBe(2)
    })
  })

  describe('navigation', () => {
    it('should navigate back to user list when Back button is clicked', () => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const locationService = injector.getInstance(LocationService)
      const updateStateSpy = vi.spyOn(locationService, 'updateState')

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      // Back button is the first button element in the page
      const backButton = page?.querySelector('button') as HTMLButtonElement

      backButton.click()

      expect(window.location.pathname).toBe('/app-settings/users')
      expect(updateStateSpy).toHaveBeenCalled()
    })
  })

  describe('role editing', () => {
    it('should add role when selected from dropdown', () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')
      const select = page?.querySelector('select') as HTMLSelectElement

      // Simulate selecting a role
      select.value = 'viewer'
      select.dispatchEvent(new Event('change', { bubbles: true }))

      // Should now have 2 role tags (admin + viewer)
      const roleTags = page?.querySelectorAll('role-tag')
      expect(roleTags?.length).toBe(2)

      // No disabled buttons anymore (Save and Cancel are enabled)
      const disabledButtons = page?.querySelectorAll('button[disabled]')
      expect(disabledButtons?.length).toBe(0)
    })

    it('should remove role when remove button is clicked', async () => {
      userObservable.setValue({
        status: 'loaded',
        value: createMockUser('testuser@example.com', ['admin', 'viewer']),
        updatedAt: new Date(),
      })

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')

      // Find and click the remove button on a role tag
      const roleTag = page?.querySelector('role-tag')
      const removeButton = roleTag?.querySelector('button')
      removeButton?.click()

      // Wait for re-render
      await new Promise((resolve) => setTimeout(resolve, 10))

      // No disabled buttons (Save and Cancel are enabled)
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

      const page = document.querySelector('user-details-page')
      const select = page?.querySelector('select') as HTMLSelectElement

      // Add a role
      select.value = 'viewer'
      select.dispatchEvent(new Event('change', { bubbles: true }))

      // Wait for state update
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Get action buttons (excluding role-tag buttons): Back (0), Save (1), Cancel (2)
      const allButtons = Array.from(page?.querySelectorAll('button') ?? [])
      const actionButtons = allButtons.filter((btn) => !btn.closest('role-tag'))
      // Cancel is the last action button
      const cancelButton = actionButtons[actionButtons.length - 1]
      cancelButton.click()

      // Wait for re-render
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Should be back to original state (1 role tag)
      const roleTags = page?.querySelectorAll('role-tag')
      expect(roleTags?.length).toBe(1)

      // Save and Cancel buttons should be disabled again
      const disabledButtons = page?.querySelectorAll('button[disabled]')
      expect(disabledButtons?.length).toBe(2)
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

      const page = document.querySelector('user-details-page')
      const select = page?.querySelector('select') as HTMLSelectElement

      // Add a role
      select.value = 'viewer'
      select.dispatchEvent(new Event('change', { bubbles: true }))

      // Wait for state update
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Get action buttons (excluding role-tag buttons): Back (0), Save (1), Cancel (2)
      const actionButtons = getActionButtons(page)
      const saveButton = actionButtons[1]
      saveButton.click()

      // Wait for async save
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

      const page = document.querySelector('user-details-page')
      const select = page?.querySelector('select') as HTMLSelectElement

      // Add a role
      select.value = 'viewer'
      select.dispatchEvent(new Event('change', { bubbles: true }))

      await new Promise((resolve) => setTimeout(resolve, 10))

      // Click Save
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

      const page = document.querySelector('user-details-page')
      const select = page?.querySelector('select') as HTMLSelectElement

      // Add a role
      select.value = 'viewer'
      select.dispatchEvent(new Event('change', { bubbles: true }))

      await new Promise((resolve) => setTimeout(resolve, 10))

      // Click Save
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
      // Make updateUser slow - need to delay to check the saving state
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

      const page = document.querySelector('user-details-page')
      const select = page?.querySelector('select') as HTMLSelectElement

      // Add a role
      select.value = 'viewer'
      select.dispatchEvent(new Event('change', { bubbles: true }))

      await new Promise((resolve) => setTimeout(resolve, 10))

      // Verify buttons are enabled before save
      const actionButtonsBefore = getActionButtons(page)
      expect(actionButtonsBefore[1]?.disabled).toBe(false) // Save
      expect(actionButtonsBefore[2]?.disabled).toBe(false) // Cancel

      // Click Save
      actionButtonsBefore[1]?.click()

      // Wait a bit for state to update
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Both Save and Cancel should be disabled while saving
      const actionButtonsAfter = getActionButtons(page)
      expect(actionButtonsAfter[1]?.disabled).toBe(true) // Save
      expect(actionButtonsAfter[2]?.disabled).toBe(true) // Cancel
    })
  })

  describe('validation', () => {
    it('should show validation error when trying to save with no roles', async () => {
      userObservable.setValue({
        status: 'loaded',
        value: createMockUser('testuser@example.com', ['viewer']),
        updatedAt: new Date(),
      })

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      const page = document.querySelector('user-details-page')

      // Remove the only role
      const roleTag = page?.querySelector('role-tag')
      const removeButton = roleTag?.querySelector('button')
      removeButton?.click()

      await new Promise((resolve) => setTimeout(resolve, 10))

      // Click Save (index 1 of action buttons, excluding role-tag buttons)
      const actionButtons = getActionButtons(page)
      const saveButton = actionButtons[1]
      saveButton.click()

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(page?.textContent).toContain('User must have at least one role')
      expect(mockUsersService.updateUser).not.toHaveBeenCalled()
    })
  })

  describe('service integration', () => {
    it('should call getUserAsObservable with username on render', () => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <UserDetailsPage username="testuser@example.com" />,
      })

      expect(mockUsersService.getUserAsObservable).toHaveBeenCalledWith('testuser@example.com')
    })
  })
})
