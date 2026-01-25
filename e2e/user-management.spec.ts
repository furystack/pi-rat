import { expect, test } from '@playwright/test'
import { assertAndDismissNoty, login, navigateToAppSettings, navigateToUsersSettings } from './helpers.js'

test.describe('User Management Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await login(page)
  })

  test('should display Users menu item in Identity section', async ({ page }) => {
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    // Verify Users menu item is visible in the Identity section
    const usersMenuItem = page.getByText('Users')
    await expect(usersMenuItem).toBeVisible()
  })

  test('should navigate to users list page', async ({ page }) => {
    await navigateToUsersSettings(page)

    // Verify we're on the users list page
    await expect(page).toHaveURL(/\/app-settings\/users/)
    await expect(page.locator('user-list-page')).toBeVisible()
  })
})

test.describe('User List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await login(page)
    await navigateToUsersSettings(page)
  })

  test('should display users page heading', async ({ page }) => {
    // Verify heading is visible
    await expect(page.locator('text=👥 Users').first()).toBeVisible()
    await expect(page.getByText('Manage user accounts and their roles.')).toBeVisible()
  })

  test('should display users table with columns', async ({ page }) => {
    const usersPage = page.locator('user-list-page')

    // Verify table headers
    await expect(usersPage.locator('th', { hasText: 'Username' })).toBeVisible()
    await expect(usersPage.locator('th', { hasText: 'Roles' })).toBeVisible()
    await expect(usersPage.locator('th', { hasText: 'Created' })).toBeVisible()
    await expect(usersPage.locator('th', { hasText: 'Actions' })).toBeVisible()
  })

  test('should display at least one user in the table', async ({ page }) => {
    const usersPage = page.locator('user-list-page')

    // Wait for table to load and verify at least one user row exists
    const tableBody = usersPage.locator('tbody')
    const rows = tableBody.locator('tr')
    await expect(rows.first()).toBeVisible()
  })

  test('should display user roles with role tags', async ({ page }) => {
    const usersPage = page.locator('user-list-page')

    // Verify role tags are rendered
    const roleTag = usersPage.locator('role-tag').first()
    await expect(roleTag).toBeVisible()
  })

  test('should navigate to user details when clicking Edit button', async ({ page }) => {
    const usersPage = page.locator('user-list-page')

    // Click Edit button on first user
    const editButton = usersPage.getByRole('button', { name: 'Edit' }).first()
    await editButton.click()

    // Verify navigation to user details
    await expect(page).toHaveURL(/\/app-settings\/users\//)
    await expect(page.locator('user-details-page')).toBeVisible()
  })

  test('should navigate to user details when clicking table row', async ({ page }) => {
    const usersPage = page.locator('user-list-page')

    // Get the first row and click it
    const firstRow = usersPage.locator('tbody tr').first()
    await firstRow.click()

    // Verify navigation to user details
    await expect(page).toHaveURL(/\/app-settings\/users\//)
    await expect(page.locator('user-details-page')).toBeVisible()
  })
})

test.describe('User Details Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await login(page)
    await navigateToUsersSettings(page)

    // Navigate to first user's details
    const usersPage = page.locator('user-list-page')
    const editButton = usersPage.getByRole('button', { name: 'Edit' }).first()
    await editButton.click()
    await expect(page.locator('user-details-page')).toBeVisible()
  })

  test('should display user information', async ({ page }) => {
    const detailsPage = page.locator('user-details-page')

    // Verify user information section
    await expect(detailsPage.getByText('User Information')).toBeVisible()
    await expect(detailsPage.getByText('Username:')).toBeVisible()
    await expect(detailsPage.getByText('Created:')).toBeVisible()
    await expect(detailsPage.getByText('Last Updated:')).toBeVisible()
  })

  test('should display roles section', async ({ page }) => {
    const detailsPage = page.locator('user-details-page')

    // Verify roles section is visible
    await expect(detailsPage.getByText('Roles').first()).toBeVisible()
  })

  test('should display current user roles with role tags', async ({ page }) => {
    const detailsPage = page.locator('user-details-page')

    // Verify at least one role tag is displayed
    const roleTag = detailsPage.locator('role-tag').first()
    await expect(roleTag).toBeVisible()
  })

  test('should navigate back to user list when clicking Back button', async ({ page }) => {
    const detailsPage = page.locator('user-details-page')

    // Click back button
    const backButton = detailsPage.getByRole('button', { name: /back/i })
    await backButton.click()

    // Verify navigation back to user list
    await expect(page).toHaveURL(/\/app-settings\/users$/)
    await expect(page.locator('user-list-page')).toBeVisible()
  })

  test('should display Add Role dropdown', async ({ page }) => {
    const detailsPage = page.locator('user-details-page')

    // Verify dropdown is visible
    await expect(detailsPage.getByText('Add Role:')).toBeVisible()
    const roleSelect = detailsPage.locator('select')
    await expect(roleSelect).toBeVisible()
  })

  test('should have Save and Cancel buttons', async ({ page }) => {
    const detailsPage = page.locator('user-details-page')

    // Verify buttons exist
    const saveButton = detailsPage.getByRole('button', { name: 'Save Changes' })
    const cancelButton = detailsPage.getByRole('button', { name: 'Cancel' })

    await expect(saveButton).toBeVisible()
    await expect(cancelButton).toBeVisible()
  })

  test('should have Save button disabled when no changes are made', async ({ page }) => {
    const detailsPage = page.locator('user-details-page')

    // Verify Save button is disabled initially
    const saveButton = detailsPage.getByRole('button', { name: 'Save Changes' })
    await expect(saveButton).toBeDisabled()
  })
})

test.describe('Role Editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await login(page)
    await navigateToUsersSettings(page)

    // Navigate to first user's details
    const usersPage = page.locator('user-list-page')
    const editButton = usersPage.getByRole('button', { name: 'Edit' }).first()
    await editButton.click()
    await expect(page.locator('user-details-page')).toBeVisible()
  })

  test('should add a role using the dropdown', async ({ page }) => {
    const detailsPage = page.locator('user-details-page')
    const roleSelect = detailsPage.locator('select')

    // Get the number of options (available roles to add)
    const optionsCount = await roleSelect.locator('option').count()

    // If there are available roles to add (more than just the placeholder)
    if (optionsCount > 1) {
      // Select the first available role option (not the placeholder)
      const options = roleSelect.locator('option')
      const secondOption = await options.nth(1).getAttribute('value')

      if (secondOption) {
        await roleSelect.selectOption(secondOption)

        // Verify a new role tag appears
        const roleTags = detailsPage.locator('role-tag')
        await expect(roleTags.first()).toBeVisible()
      }
    }
  })

  test('should enable Save button when changes are made', async ({ page }) => {
    const detailsPage = page.locator('user-details-page')
    const roleSelect = detailsPage.locator('select')
    const saveButton = detailsPage.getByRole('button', { name: 'Save Changes' })

    // Initially Save button should be disabled
    await expect(saveButton).toBeDisabled()

    // Check if there are available roles to add
    const optionsCount = await roleSelect.locator('option').count()

    if (optionsCount > 1) {
      // Add a role
      const options = roleSelect.locator('option')
      const secondOption = await options.nth(1).getAttribute('value')

      if (secondOption) {
        await roleSelect.selectOption(secondOption)

        // Save button should now be enabled
        await expect(saveButton).toBeEnabled()
      }
    }
  })

  test('should remove a role by clicking the remove button', async ({ page }) => {
    const detailsPage = page.locator('user-details-page')
    const saveButton = detailsPage.getByRole('button', { name: 'Save Changes' })

    // Get current role tags count
    const roleTags = detailsPage.locator('role-tag')
    const initialCount = await roleTags.count()

    if (initialCount > 0) {
      // Find and click the remove button on the first role tag
      const firstRoleTag = roleTags.first()
      const removeButton = firstRoleTag.locator('button', { hasText: '×' })

      // Check if remove button exists (some roles may not have it)
      if ((await removeButton.count()) > 0) {
        await removeButton.click()

        // Save button should be enabled after removing a role
        await expect(saveButton).toBeEnabled()
      }
    }
  })

  test('should cancel changes and restore original roles', async ({ page }) => {
    const detailsPage = page.locator('user-details-page')
    const roleSelect = detailsPage.locator('select')
    const cancelButton = detailsPage.getByRole('button', { name: 'Cancel' })
    const saveButton = detailsPage.getByRole('button', { name: 'Save Changes' })

    // Check if there are available roles to add
    const optionsCount = await roleSelect.locator('option').count()

    if (optionsCount > 1) {
      // Add a role to make changes
      const options = roleSelect.locator('option')
      const secondOption = await options.nth(1).getAttribute('value')

      if (secondOption) {
        await roleSelect.selectOption(secondOption)

        // Verify Save is now enabled
        await expect(saveButton).toBeEnabled()

        // Click Cancel
        await cancelButton.click()

        // Save button should be disabled again
        await expect(saveButton).toBeDisabled()
      }
    }
  })
})

test.describe('Save Role Changes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await login(page)
    await navigateToUsersSettings(page)
  })

  test('should save role changes successfully', async ({ page }) => {
    // Navigate to user details
    const usersPage = page.locator('user-list-page')
    const editButton = usersPage.getByRole('button', { name: 'Edit' }).first()
    await editButton.click()
    await expect(page.locator('user-details-page')).toBeVisible()

    const detailsPage = page.locator('user-details-page')
    const roleSelect = detailsPage.locator('select')
    const saveButton = detailsPage.getByRole('button', { name: 'Save Changes' })

    // Check if there are available roles to add
    const optionsCount = await roleSelect.locator('option').count()

    if (optionsCount > 1) {
      // Add a role
      const options = roleSelect.locator('option')
      const secondOption = await options.nth(1).getAttribute('value')

      if (secondOption) {
        await roleSelect.selectOption(secondOption)

        // Save changes
        await saveButton.click()

        // Verify success notification
        await assertAndDismissNoty(page, 'User roles updated successfully')

        // Save button should be disabled after saving
        await expect(saveButton).toBeDisabled()
      }
    }
  })

  test('should show validation error when removing all roles', async ({ page }) => {
    // Navigate to user details
    const usersPage = page.locator('user-list-page')
    const editButton = usersPage.getByRole('button', { name: 'Edit' }).first()
    await editButton.click()
    await expect(page.locator('user-details-page')).toBeVisible()

    const detailsPage = page.locator('user-details-page')
    const saveButton = detailsPage.getByRole('button', { name: 'Save Changes' })

    // Remove all roles one by one
    const roleTags = detailsPage.locator('role-tag')
    let roleCount = await roleTags.count()

    while (roleCount > 0) {
      const roleTag = roleTags.first()
      const removeButton = roleTag.locator('button', { hasText: '×' })

      if ((await removeButton.count()) > 0) {
        await removeButton.click()
      } else {
        break
      }

      roleCount = await roleTags.count()
    }

    // Try to save
    if (await saveButton.isEnabled()) {
      await saveButton.click()

      // Should show validation error
      await expect(detailsPage.getByText('User must have at least one role')).toBeVisible()
    }
  })
})

test.describe('Role Tag Display Variants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await login(page)
    await navigateToUsersSettings(page)

    // Navigate to first user's details
    const usersPage = page.locator('user-list-page')
    const editButton = usersPage.getByRole('button', { name: 'Edit' }).first()
    await editButton.click()
    await expect(page.locator('user-details-page')).toBeVisible()
  })

  test('should show role with remove button for existing roles', async ({ page }) => {
    const detailsPage = page.locator('user-details-page')
    const roleTags = detailsPage.locator('role-tag')

    // Check if there are any role tags
    const count = await roleTags.count()

    if (count > 0) {
      const firstRoleTag = roleTags.first()

      // Verify the role tag is visible
      await expect(firstRoleTag).toBeVisible()

      // Verify the role displays text (the displayName)
      const text = await firstRoleTag.textContent()
      expect(text?.length).toBeGreaterThan(0)
    }
  })

  test('should show restore button for removed roles', async ({ page }) => {
    const detailsPage = page.locator('user-details-page')
    const roleTags = detailsPage.locator('role-tag')

    // Get initial role count
    const initialCount = await roleTags.count()

    if (initialCount > 0) {
      // Find a role with remove button
      const firstRoleTag = roleTags.first()
      const removeButton = firstRoleTag.locator('button', { hasText: '×' })

      if ((await removeButton.count()) > 0) {
        await removeButton.click()

        // Find the role tag that now has restore button (↩)
        const removedRoleTag = detailsPage.locator('role-tag').locator('button', { hasText: '↩' })

        // Should have a restore button
        await expect(removedRoleTag.first()).toBeVisible()
      }
    }
  })

  test('should restore a removed role by clicking restore button', async ({ page }) => {
    const detailsPage = page.locator('user-details-page')
    const roleTags = detailsPage.locator('role-tag')
    const saveButton = detailsPage.getByRole('button', { name: 'Save Changes' })

    // Get initial role count
    const initialCount = await roleTags.count()

    if (initialCount > 0) {
      // Find a role with remove button and remove it
      const firstRoleTag = roleTags.first()
      const removeButton = firstRoleTag.locator('button', { hasText: '×' })

      if ((await removeButton.count()) > 0) {
        await removeButton.click()

        // Save should be enabled
        await expect(saveButton).toBeEnabled()

        // Find and click restore button
        const restoreButton = detailsPage.locator('role-tag').locator('button', { hasText: '↩' }).first()
        await restoreButton.click()

        // Save should be disabled again (no net changes)
        await expect(saveButton).toBeDisabled()
      }
    }
  })
})
