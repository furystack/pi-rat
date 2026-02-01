import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { assertAndDismissNoty, login, logout, navigateToAppSettings, registerUser } from './helpers.js'

const TEST_USER_PASSWORD = 'testpassword123'

/**
 * Generate a unique test username per project and test attempt.
 * This ensures retries don't fail due to user already existing from previous attempt.
 */
const getTestUserName = (projectName: string, testId: string) => `role-tester-${projectName}-${testId}@test.com`

/**
 * Helper: Add a role to the user via dropdown. Returns the role name added, or null if no roles available.
 */
const addRoleToUser = async (page: Page): Promise<string | null> => {
  const detailsPage = page.locator('user-details-page')
  const roleSelect = detailsPage.locator('select')

  const selectCount = await roleSelect.count()
  if (selectCount === 0) {
    return null
  }

  const optionsCount = await roleSelect.locator('option').count()
  if (optionsCount <= 1) {
    return null
  }

  const options = roleSelect.locator('option')
  const roleValue = await options.nth(1).getAttribute('value')
  if (!roleValue) {
    return null
  }

  await roleSelect.selectOption(roleValue)
  return roleValue
}

/**
 * Helper: Remove the first role from the user. Returns the role name removed, or null if none available.
 */
const removeRole = async (page: Page): Promise<string | null> => {
  const detailsPage = page.locator('user-details-page')
  const roleTags = detailsPage.locator('role-tag')

  const roleCount = await roleTags.count()
  if (roleCount === 0) {
    return null
  }

  const roleTag = roleTags.first()
  const roleText = await roleTag.textContent()

  const removeButton = roleTag.locator('button', { hasText: '×' })
  const removeButtonCount = await removeButton.count()
  if (removeButtonCount > 0) {
    await removeButton.click()
    return roleText?.replace('×', '').replace('↩', '').trim() ?? null
  }

  return null
}

test.describe('User Management', () => {
  test('Admin can manage user roles', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name
    // Use retry count and timestamp to ensure unique username per test attempt
    const testId = `${testInfo.retry}-${Date.now()}`
    const testUserName = getTestUserName(projectName, testId)

    // ============================================
    // SETUP: Register a project-specific test user
    // ============================================
    await registerUser(page, testUserName, TEST_USER_PASSWORD)
    await logout(page)

    // ============================================
    // STEP 1: Login as admin and navigate to users
    // ============================================
    await login(page)
    await navigateToAppSettings(page)

    const usersMenuItem = page.getByText('Users')
    await expect(usersMenuItem).toBeVisible()
    await usersMenuItem.click()
    await page.waitForURL(/\/app-settings\/users/)

    const usersPage = page.locator('user-list-page')
    await expect(usersPage).toBeVisible()
    await expect(page.locator('text=👥 Users').first()).toBeVisible()

    // ============================================
    // STEP 2: Open the test user's details
    // ============================================
    const testUserRow = usersPage.locator('tbody tr', { hasText: testUserName })
    await expect(testUserRow).toBeVisible()
    await testUserRow.getByRole('button', { name: 'Edit' }).click()

    await expect(page).toHaveURL(/\/app-settings\/users\//)

    const detailsPage = page.locator('user-details-page')
    await expect(detailsPage).toBeVisible()

    const saveButton = detailsPage.getByRole('button', { name: 'Save Changes' })
    const cancelButton = detailsPage.getByRole('button', { name: 'Cancel' })

    // Save should be disabled initially (no changes)
    await expect(saveButton).toBeDisabled()

    // ============================================
    // STEP 3: Verify user starts with no roles
    // ============================================
    expect(await detailsPage.locator('role-tag').count(), 'New user should have no roles').toBe(0)

    // ============================================
    // STEP 4: Test Cancel functionality - add a role then cancel
    // ============================================
    const addedRole = await addRoleToUser(page)
    expect(addedRole, 'Should be able to add a role').not.toBeNull()
    await expect(saveButton).toBeEnabled()

    // Cancel should restore original state (no roles)
    await cancelButton.click()
    await expect(saveButton).toBeDisabled()
    expect(await detailsPage.locator('role-tag').count()).toBe(0)

    // ============================================
    // STEP 5: Add a role and save
    // ============================================
    const roleToAdd = await addRoleToUser(page)
    expect(roleToAdd, 'Should be able to add a role').not.toBeNull()

    await saveButton.click()
    await assertAndDismissNoty(page, 'User roles updated successfully')

    // Wait for the details page to stabilize after save
    await expect(detailsPage).toBeVisible()
    await expect(detailsPage.getByRole('button', { name: 'Save Changes' })).toBeDisabled()

    // Reload and verify persistence
    await page.reload()
    await expect(detailsPage).toBeVisible()
    // Wait for the role-tag to be rendered after the page fetches user data
    await expect(detailsPage.locator('role-tag').first()).toBeVisible()
    expect(await detailsPage.locator('role-tag').count()).toBe(1)

    // Re-locate buttons after reload
    const saveButtonAfterReload = detailsPage.getByRole('button', { name: 'Save Changes' })
    const cancelButtonAfterReload = detailsPage.getByRole('button', { name: 'Cancel' })

    // ============================================
    // STEP 6: Test remove and restore functionality
    // ============================================
    const removed = await removeRole(page)
    expect(removed).not.toBeNull()

    // Restore button should appear for removed role
    const restoreButton = detailsPage.locator('role-tag').locator('button', { hasText: '↩' }).first()
    await expect(restoreButton).toBeVisible()
    await restoreButton.click()

    // No net changes after restore, save should be disabled
    await expect(saveButtonAfterReload).toBeDisabled()

    // ============================================
    // STEP 7: Test validation - cannot save with zero roles
    // ============================================
    await removeRole(page)
    await expect(saveButtonAfterReload).toBeEnabled()
    await saveButtonAfterReload.click()
    await expect(detailsPage.getByText('User must have at least one role')).toBeVisible()

    // Cancel to restore the role
    await cancelButtonAfterReload.click()
    expect(await detailsPage.locator('role-tag').count()).toBe(1)

    // ============================================
    // STEP 8: Navigate back to users list
    // ============================================
    const backButton = detailsPage.getByRole('button', { name: /back/i })
    await backButton.click()

    await expect(page).toHaveURL(/\/app-settings\/users$/)
    await expect(usersPage).toBeVisible()
  })
})
