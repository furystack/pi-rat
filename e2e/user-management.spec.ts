import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { assertAndDismissNoty, login, navigateToAppSettings } from './helpers.js'

/**
 * Helper: Verify the users table structure has all expected columns
 */
const verifyUsersTableStructure = async (page: Page) => {
  const usersPage = page.locator('user-list-page')

  await expect(usersPage.locator('th', { hasText: 'Username' })).toBeVisible()
  await expect(usersPage.locator('th', { hasText: 'Roles' })).toBeVisible()
  await expect(usersPage.locator('th', { hasText: 'Created' })).toBeVisible()
  await expect(usersPage.locator('th', { hasText: 'Actions' })).toBeVisible()
}

/**
 * Helper: Verify the user details form has all expected elements
 */
const verifyUserDetailsForm = async (page: Page) => {
  const detailsPage = page.locator('user-details-page')

  await expect(detailsPage.getByText('User Information')).toBeVisible()
  await expect(detailsPage.getByText('Username:')).toBeVisible()
  await expect(detailsPage.getByText('Created:')).toBeVisible()
  await expect(detailsPage.getByText('Last Updated:')).toBeVisible()
  await expect(detailsPage.getByText('Roles').first()).toBeVisible()

  // Verify action buttons exist
  await expect(detailsPage.getByRole('button', { name: 'Save Changes' })).toBeVisible()
  await expect(detailsPage.getByRole('button', { name: 'Cancel' })).toBeVisible()
  await expect(detailsPage.getByRole('button', { name: /back/i })).toBeVisible()
}

/**
 * Helper: Add a role to the user via dropdown. Returns the role name added, or null if no roles available.
 */
const addRoleToUser = async (page: Page): Promise<string | null> => {
  const detailsPage = page.locator('user-details-page')
  const roleSelect = detailsPage.locator('select')

  // Check if dropdown is visible (only shown when roles available to add)
  const selectCount = await roleSelect.count()
  if (selectCount === 0) {
    return null
  }

  const optionsCount = await roleSelect.locator('option').count()
  if (optionsCount <= 1) {
    // Only placeholder option, no roles available
    return null
  }

  // Select the first available role option (not the placeholder)
  const options = roleSelect.locator('option')
  const roleValue = await options.nth(1).getAttribute('value')
  if (!roleValue) {
    return null
  }

  await roleSelect.selectOption(roleValue)
  return roleValue
}

/**
 * Helper: Remove a specific role by name. Returns true if the role was removed.
 * IMPORTANT: Avoids removing 'admin' role to prevent locking out the test user.
 */
const removeRoleByName = async (page: Page, roleName: string): Promise<boolean> => {
  const detailsPage = page.locator('user-details-page')
  const roleTag = detailsPage.locator('role-tag', { hasText: roleName })

  const roleCount = await roleTag.count()
  if (roleCount === 0) {
    return false
  }

  const removeButton = roleTag.first().locator('button', { hasText: '×' })
  const removeButtonCount = await removeButton.count()
  if (removeButtonCount === 0) {
    return false
  }

  await removeButton.click()
  return true
}

/**
 * Helper: Remove a non-admin role from the user. Returns the role name removed, or null if none available.
 * IMPORTANT: Never removes 'admin' role to prevent locking out the test user.
 */
const removeNonAdminRole = async (page: Page): Promise<string | null> => {
  const detailsPage = page.locator('user-details-page')
  const roleTags = detailsPage.locator('role-tag')

  const roleCount = await roleTags.count()
  for (let i = 0; i < roleCount; i++) {
    const roleTag = roleTags.nth(i)
    const roleText = await roleTag.textContent()
    // Skip admin role to avoid locking out the test user
    if (roleText?.toLowerCase().includes('admin')) {
      continue
    }

    const removeButton = roleTag.locator('button', { hasText: '×' })
    const removeButtonCount = await removeButton.count()
    if (removeButtonCount > 0) {
      await removeButton.click()
      // Extract role name (remove the × button text)
      return roleText?.replace('×', '').replace('↩', '').trim() ?? null
    }
  }
  return null
}

test.describe('User Management', () => {
  test('Admin can navigate to users, view user details, edit roles, and verify persistence', async ({ page }) => {
    // ============================================
    // STEP 1: Login as admin
    // ============================================
    await page.goto('/')
    await login(page)

    // ============================================
    // STEP 2: Navigate to app settings, verify Users menu is visible
    // ============================================
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    const usersMenuItem = page.getByText('Users')
    await expect(usersMenuItem).toBeVisible()

    // ============================================
    // STEP 3: Click Users, verify users table structure
    // ============================================
    await usersMenuItem.click()
    await page.waitForURL(/\/app-settings\/users/)

    const usersPage = page.locator('user-list-page')
    await expect(usersPage).toBeVisible()

    // Verify page heading
    await expect(page.locator('text=👥 Users').first()).toBeVisible()
    await expect(page.getByText('Manage user accounts and their roles.')).toBeVisible()

    // Verify table structure
    await verifyUsersTableStructure(page)

    // ============================================
    // STEP 4: Verify at least one user (admin) exists in the table
    // ============================================
    const tableBody = usersPage.locator('tbody')
    const rows = tableBody.locator('tr')
    await expect(rows.first()).toBeVisible()

    // Verify role tags are rendered in the table
    const roleTagInTable = usersPage.locator('role-tag').first()
    await expect(roleTagInTable).toBeVisible()

    // ============================================
    // STEP 5: Open first user via Edit button, verify form elements
    // ============================================
    const editButton = usersPage.getByRole('button', { name: 'Edit' }).first()
    await editButton.click()

    await expect(page).toHaveURL(/\/app-settings\/users\//)

    const detailsPage = page.locator('user-details-page')
    await expect(detailsPage).toBeVisible()

    // Verify form structure
    await verifyUserDetailsForm(page)

    // Verify Save button is disabled initially (no changes)
    const saveButton = detailsPage.getByRole('button', { name: 'Save Changes' })
    await expect(saveButton).toBeDisabled()

    // ============================================
    // STEP 6: Record initial role count, then add or remove a role
    // ============================================
    const initialRoleCount = await detailsPage.locator('role-tag').count()
    expect(initialRoleCount, 'User should have at least one role').toBeGreaterThan(0)

    // Try to add a role first
    const addedRole = await addRoleToUser(page)
    const roleWasAdded = addedRole !== null
    let removedRole: string | null = null

    if (!roleWasAdded) {
      // User has all roles - remove a non-admin role instead
      removedRole = await removeNonAdminRole(page)
      expect(removedRole, 'Should be able to remove a non-admin role').not.toBeNull()
    }

    // Verify Save button is now enabled
    await expect(saveButton).toBeEnabled()

    // ============================================
    // STEP 7: Save the changes
    // ============================================
    await saveButton.click()
    await assertAndDismissNoty(page, 'User roles updated successfully')

    // Verify Save button is disabled after saving (no pending changes)
    await expect(saveButton).toBeDisabled()

    // ============================================
    // STEP 8: Reload page, verify role change persisted
    // ============================================
    await page.reload()
    await expect(detailsPage).toBeVisible()

    const newRoleCount = await detailsPage.locator('role-tag').count()
    if (roleWasAdded) {
      expect(newRoleCount).toBe(initialRoleCount + 1)
    } else {
      expect(newRoleCount).toBe(initialRoleCount - 1)
    }

    // ============================================
    // STEP 9: Restore to original state - reverse the change we made
    // ============================================
    if (roleWasAdded) {
      // We added a role, now remove it by name (not removing admin!)
      const removed = await removeRoleByName(page, addedRole)
      expect(removed, 'Should be able to remove the added role').toBeTruthy()
    } else {
      // We removed a role, now add it back (use dropdown since it should be available)
      const added = await addRoleToUser(page)
      expect(added, 'Should be able to add a role back').not.toBeNull()
    }

    // Save to restore original state
    await expect(saveButton).toBeEnabled()
    await saveButton.click()
    await assertAndDismissNoty(page, 'User roles updated successfully')

    // ============================================
    // STEP 10: Verify clean state - back to original role count
    // ============================================
    const finalRoleCount = await detailsPage.locator('role-tag').count()
    expect(finalRoleCount).toBe(initialRoleCount)

    // ============================================
    // STEP 11: Test navigation back to users list
    // ============================================
    const backButton = detailsPage.getByRole('button', { name: /back/i })
    await backButton.click()

    await expect(page).toHaveURL(/\/app-settings\/users$/)
    await expect(usersPage).toBeVisible()
  })

  test('Admin can verify role editing UI behavior (add, remove, restore, cancel)', async ({ page }) => {
    // ============================================
    // STEP 1: Setup - Login and navigate to user details
    // ============================================
    await page.goto('/')
    await login(page)
    await navigateToAppSettings(page)
    await page.getByText('Users').click()
    await page.waitForURL(/\/app-settings\/users/)

    const usersPage = page.locator('user-list-page')
    await usersPage.getByRole('button', { name: 'Edit' }).first().click()

    const detailsPage = page.locator('user-details-page')
    await expect(detailsPage).toBeVisible()

    const saveButton = detailsPage.getByRole('button', { name: 'Save Changes' })
    const cancelButton = detailsPage.getByRole('button', { name: 'Cancel' })

    // ============================================
    // STEP 2: Test Cancel functionality - make change then cancel
    // ============================================
    const initialCount = await detailsPage.locator('role-tag').count()

    // Make a change (add or remove a non-admin role)
    const addedRole = await addRoleToUser(page)
    if (!addedRole) {
      await removeNonAdminRole(page)
    }

    // Verify Save is enabled after change
    await expect(saveButton).toBeEnabled()

    // Click Cancel - should restore original state
    await cancelButton.click()

    // Verify Save is disabled again (no changes)
    await expect(saveButton).toBeDisabled()

    // Verify role count is back to initial
    const afterCancelCount = await detailsPage.locator('role-tag').count()
    expect(afterCancelCount).toBe(initialCount)

    // ============================================
    // STEP 3: Test remove and restore UI behavior
    // ============================================
    // Remove a non-admin role to test restore functionality
    const removed = await removeNonAdminRole(page)
    expect(removed).not.toBeNull()

    // Verify restore button appears for removed role
    const restoreButton = detailsPage.locator('role-tag').locator('button', { hasText: '↩' }).first()
    await expect(restoreButton).toBeVisible()

    // Click restore
    await restoreButton.click()

    // Verify Save is disabled (no net changes)
    await expect(saveButton).toBeDisabled()

    // ============================================
    // STEP 4: Test validation - cannot save with zero roles
    // ============================================
    // Remove all roles one by one
    let roleCount = await detailsPage.locator('role-tag').count()
    while (roleCount > 0) {
      const removeBtn = detailsPage.locator('role-tag').first().locator('button', { hasText: '×' })
      const removeBtnCount = await removeBtn.count()
      if (removeBtnCount === 0) break
      await removeBtn.click()
      roleCount = await detailsPage.locator('role-tag').count()
    }

    // Try to save with no roles
    await expect(saveButton).toBeEnabled()
    await saveButton.click()

    // Should show validation error
    await expect(detailsPage.getByText('User must have at least one role')).toBeVisible()

    // Cancel to restore original state (don't persist invalid state)
    await cancelButton.click()
  })
})
