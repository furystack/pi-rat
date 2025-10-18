import { expect, test } from '@playwright/test'
import { assertAndDismissNoty, login, logout, navigateToUserSettings } from './helpers.js'

test('User Settings Navigation', async ({ page }) => {
  await page.goto('/')
  await login(page)

  await navigateToUserSettings(page)

  const settingsHeading = page.locator('h1', { hasText: 'User Settings' })
  await expect(settingsHeading).toBeVisible()

  // Verify Profile section is visible
  const profileSection = page.locator('h3', { hasText: 'Profile' })
  await expect(profileSection).toBeVisible()

  // Verify Security section is visible
  const securitySection = page.locator('h3', { hasText: 'Security' })
  await expect(securitySection).toBeVisible()

  // Verify password change form is present
  const passwordForm = page.locator('form[data-password-reset-form]')
  await expect(passwordForm).toBeVisible()

  // Verify form inputs are present
  const currentPasswordInput = passwordForm.locator('input[name="currentPassword"]')
  await expect(currentPasswordInput).toBeVisible()

  const newPasswordInput = passwordForm.locator('input[name="newPassword"]')
  await expect(newPasswordInput).toBeVisible()

  const confirmPasswordInput = passwordForm.locator('input[name="confirmPassword"]')
  await expect(confirmPasswordInput).toBeVisible()

  const updateButton = passwordForm.getByRole('button', { name: /update password/i })
  await expect(updateButton).toBeVisible()
})

test('Password Reset Functionality', async ({ page }) => {
  await page.goto('/')
  await login(page)

  // Navigate to user settings
  await navigateToUserSettings(page)

  // Find the password form
  const passwordForm = page.locator('form[data-password-reset-form]')
  await expect(passwordForm).toBeVisible()

  const currentPasswordInput = passwordForm.locator('input[name="currentPassword"]')
  const newPasswordInput = passwordForm.locator('input[name="newPassword"]')
  const confirmPasswordInput = passwordForm.locator('input[name="confirmPassword"]')
  const updateButton = passwordForm.getByRole('button', { name: /update password/i })

  // Test password mismatch validation
  await currentPasswordInput.fill('password')
  await newPasswordInput.fill('newPassword123')
  await confirmPasswordInput.fill('differentPassword123')
  await updateButton.click()

  // Should show error message for password mismatch
  const errorMessage = page.locator('div', { hasText: 'New passwords do not match' })
  await expect(errorMessage).toBeVisible()

  // Test successful password reset
  await currentPasswordInput.fill('password')
  await newPasswordInput.fill('newPassword123')
  await confirmPasswordInput.fill('newPassword123')
  await updateButton.click()

  // Should show success notification
  await assertAndDismissNoty(page, 'Your password has been updated successfully')

  // Form should be cleared after successful update
  await expect(currentPasswordInput).toHaveValue('')
  await expect(newPasswordInput).toHaveValue('')
  await expect(confirmPasswordInput).toHaveValue('')

  // Test login with new password by logging out and back in
  await logout(page)

  // Try logging in with the new password
  const loginForm = page.locator('shade-login form')
  const usernameInput = loginForm.locator('input[name="userName"]')
  const passwordInput = loginForm.locator('input[name="password"]')
  const loginButton = page.getByRole('button', { name: 'Login' })

  await usernameInput.fill('testuser@gmail.com')
  await passwordInput.fill('newPassword123')
  await loginButton.click()

  await assertAndDismissNoty(page, 'Welcome back ;)')

  // Verify user is logged in by checking for the circular avatar
  const loggedInAvatar = page.locator('[style*="border-radius: 50%"][style*="cursor: pointer"]')
  await expect(loggedInAvatar).toBeVisible()
})

test('Password Reset Error Handling', async ({ page }) => {
  await page.goto('/')
  await login(page)

  // Navigate to user settings
  await navigateToUserSettings(page)

  const passwordForm = page.locator('form[data-password-reset-form]')
  const currentPasswordInput = passwordForm.locator('input[name="currentPassword"]')
  const newPasswordInput = passwordForm.locator('input[name="newPassword"]')
  const confirmPasswordInput = passwordForm.locator('input[name="confirmPassword"]')
  const updateButton = passwordForm.getByRole('button', { name: /update password/i })

  // Test with incorrect current password
  await currentPasswordInput.fill('wrongPassword')
  await newPasswordInput.fill('newPassword123')
  await confirmPasswordInput.fill('newPassword123')
  await updateButton.click()

  // Should show error notification for incorrect current password
  const errorNoty = page.locator('shade-noty', { hasText: 'Current password is incorrect' })
  await expect(errorNoty).toBeVisible()

  const closeErrorNoty = errorNoty.locator('button.dismissNoty')
  await closeErrorNoty.click()
  await errorNoty.waitFor({ state: 'detached' })

  // Test with password that doesn't meet complexity requirements (if any)
  await currentPasswordInput.fill('password')
  await newPasswordInput.fill('123') // Too simple
  await confirmPasswordInput.fill('123')
  await updateButton.click()

  // Should show error notification for complexity requirements
  const complexityErrorNoty = page.locator('shade-noty')
  await expect(complexityErrorNoty).toBeVisible()

  const closeComplexityNoty = complexityErrorNoty.locator('button.dismissNoty')
  await closeComplexityNoty.click()
  await complexityErrorNoty.waitFor({ state: 'detached' })
})

test('User Profile Information Display', async ({ page }) => {
  await page.goto('/')
  await login(page)

  // Navigate to user settings
  await navigateToUserSettings(page)

  // Verify profile section shows user information
  const profileSection = page.locator('h3', { hasText: 'Profile' }).locator('..') // Parent element

  // Check that username is displayed
  const usernameLabel = profileSection.locator('text=Username')
  await expect(usernameLabel).toBeVisible()

  const usernameValue = profileSection.locator('text=testuser@gmail.com')
  await expect(usernameValue).toBeVisible()

  // Check that roles are displayed
  const rolesLabel = profileSection.locator('text=Roles')
  await expect(rolesLabel).toBeVisible()

  // The test user should have admin role
  const adminRole = profileSection.locator('text=admin')
  await expect(adminRole).toBeVisible()
})
