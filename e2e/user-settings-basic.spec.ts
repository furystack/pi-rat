import { expect, test } from '@playwright/test'
import { login, navigateToUserSettings } from './helpers.js'

test('User Settings Page Access', async ({ page }) => {
  await page.goto('/')
  await login(page)

  // Navigate to user settings
  await navigateToUserSettings(page)

  // Verify we're on the settings page
  const settingsHeading = page.locator('h1', { hasText: 'User Settings' })
  await expect(settingsHeading).toBeVisible()

  // Verify Profile section is visible
  const profileSection = page.locator('h3', { hasText: 'Profile' })
  await expect(profileSection).toBeVisible()

  // Verify Security section is visible
  const securitySection = page.locator('h3', { hasText: 'Security' })
  await expect(securitySection).toBeVisible()
})

test('Password Reset Form Elements', async ({ page }) => {
  await page.goto('/')
  await login(page)
  await navigateToUserSettings(page)

  // Verify password change form is present
  const passwordForm = page.locator('form[data-password-reset-form]')
  await expect(passwordForm).toBeVisible()

  // Verify form inputs are present and functional
  const currentPasswordInput = passwordForm.locator('input[name="currentPassword"]')
  await expect(currentPasswordInput).toBeVisible()
  await expect(currentPasswordInput).toHaveAttribute('type', 'password')

  const newPasswordInput = passwordForm.locator('input[name="newPassword"]')
  await expect(newPasswordInput).toBeVisible()
  await expect(newPasswordInput).toHaveAttribute('type', 'password')

  const confirmPasswordInput = passwordForm.locator('input[name="confirmPassword"]')
  await expect(confirmPasswordInput).toBeVisible()
  await expect(confirmPasswordInput).toHaveAttribute('type', 'password')

  const updateButton = passwordForm.getByRole('button', { name: /update password/i })
  await expect(updateButton).toBeVisible()
  await expect(updateButton).toBeEnabled()
})

test('User Profile Information Display', async ({ page }) => {
  await page.goto('/')
  await login(page)
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

test('Form Input Functionality', async ({ page }) => {
  await page.goto('/')
  await login(page)
  await navigateToUserSettings(page)

  const passwordForm = page.locator('form[data-password-reset-form]')
  const currentPasswordInput = passwordForm.locator('input[name="currentPassword"]')
  const newPasswordInput = passwordForm.locator('input[name="newPassword"]')
  const confirmPasswordInput = passwordForm.locator('input[name="confirmPassword"]')

  // Test that inputs can be filled and retain values
  await currentPasswordInput.fill('testCurrentPassword')
  await newPasswordInput.fill('testNewPassword')
  await confirmPasswordInput.fill('testConfirmPassword')

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
})
