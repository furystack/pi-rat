import { expect, test } from '@playwright/test'
import { login, navigateToUserSettings } from './helpers.js'

test.describe('User Settings', () => {
  test('User can view profile, verify settings page structure, and interact with password form', async ({ page }) => {
    // ============================================
    // STEP 1: Login and navigate to user settings
    // ============================================
    await page.goto('/')
    await login(page)
    await navigateToUserSettings(page)

    // ============================================
    // STEP 2: Verify page structure and heading
    // ============================================
    const settingsHeading = page.locator('h1', { hasText: 'User Settings' })
    await expect(settingsHeading).toBeVisible()

    // Verify Profile section is visible
    const profileSection = page.locator('h3', { hasText: 'Profile' })
    await expect(profileSection).toBeVisible()

    // Verify Security section is visible
    const securitySection = page.locator('h3', { hasText: 'Security' })
    await expect(securitySection).toBeVisible()

    // ============================================
    // STEP 3: Verify user profile information display
    // ============================================
    const profileContainer = profileSection.locator('..') // Parent element

    // Check that username is displayed
    const usernameLabel = profileContainer.locator('text=Username')
    await expect(usernameLabel).toBeVisible()

    const usernameValue = profileContainer.locator('text=testuser@gmail.com')
    await expect(usernameValue).toBeVisible()

    // Check that roles are displayed
    const rolesLabel = profileContainer.locator('text=Roles')
    await expect(rolesLabel).toBeVisible()

    // The test user should have admin role
    const adminRole = profileContainer.locator('text=admin')
    await expect(adminRole).toBeVisible()

    // ============================================
    // STEP 4: Verify password reset form structure
    // ============================================
    const passwordForm = page.locator('form[data-password-reset-form]')
    await expect(passwordForm).toBeVisible()

    const currentPasswordInput = passwordForm.locator('input[name="currentPassword"]')
    const newPasswordInput = passwordForm.locator('input[name="newPassword"]')
    const confirmPasswordInput = passwordForm.locator('input[name="confirmPassword"]')
    const updateButton = passwordForm.getByRole('button', { name: /update password/i })

    await expect(currentPasswordInput).toBeVisible()
    await expect(currentPasswordInput).toHaveAttribute('type', 'password')

    await expect(newPasswordInput).toBeVisible()
    await expect(newPasswordInput).toHaveAttribute('type', 'password')

    await expect(confirmPasswordInput).toBeVisible()
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password')

    await expect(updateButton).toBeVisible()
    await expect(updateButton).toBeEnabled()

    // ============================================
    // STEP 5: Test form input functionality
    // ============================================
    // Fill in test values
    await currentPasswordInput.fill('testCurrentPassword')
    await newPasswordInput.fill('testNewPassword')
    await confirmPasswordInput.fill('testConfirmPassword')

    // Verify values are retained
    await expect(currentPasswordInput).toHaveValue('testCurrentPassword')
    await expect(newPasswordInput).toHaveValue('testNewPassword')
    await expect(confirmPasswordInput).toHaveValue('testConfirmPassword')

    // Test that inputs can be cleared
    await currentPasswordInput.fill('')
    await newPasswordInput.fill('')
    await confirmPasswordInput.fill('')

    await expect(currentPasswordInput).toHaveValue('')
    await expect(newPasswordInput).toHaveValue('')
    await expect(confirmPasswordInput).toHaveValue('')

    // ============================================
    // STEP 6: Test basic password reset flow (form interaction only)
    // ============================================
    // Fill form with valid-looking data (not actually submitting to change password)
    await currentPasswordInput.fill('password')
    await newPasswordInput.fill('newPassword123')
    await confirmPasswordInput.fill('newPassword123')

    // Verify form inputs work correctly
    await expect(currentPasswordInput).toHaveValue('password')
    await expect(newPasswordInput).toHaveValue('newPassword123')
    await expect(confirmPasswordInput).toHaveValue('newPassword123')

    // Verify update button is clickable (but don't click to avoid changing password)
    await expect(updateButton).toBeEnabled()

    // Clear form to leave clean state
    await currentPasswordInput.fill('')
    await newPasswordInput.fill('')
    await confirmPasswordInput.fill('')
  })
})
