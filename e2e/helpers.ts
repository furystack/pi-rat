import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { readFile } from 'fs/promises'
import { basename } from 'path'

export const assertAndDismissNoty = async (page: Page, text: string, options?: { timeout?: number }) => {
  const timeout = options?.timeout ?? 30_000
  const noty = page.locator('shade-noty', { hasText: text })

  await expect(noty).toBeVisible({ timeout })

  const closeNoty = noty.locator('button.dismiss-button')
  await closeNoty.click()
  await expect(noty).not.toBeVisible()
}

export const login = async (page: Page, username = 'testuser@gmail.com', password = 'password') => {
  const loginForm = page.locator('shade-login form')
  await expect(loginForm).toBeVisible()

  const usernameInput = loginForm.locator('input[name="userName"]')
  const passwordInput = loginForm.locator('input[name="password"]')
  const submitButton = page.getByRole('button', { name: 'Login' })

  await usernameInput.fill(username)
  await passwordInput.fill(password)
  await submitButton.click()

  await assertAndDismissNoty(page, 'Welcome back ;)')

  // Verify user is logged in by checking for user avatar (should contain first letter of username)
  const firstLetter = username.charAt(0).toUpperCase()
  const userAvatar = page.getByText(firstLetter).first()
  await expect(userAvatar).toBeVisible()
}

export const getUserAvatar = (page: Page) => {
  return page.locator('user-avatar-menu')
}

export const logout = async (page: Page) => {
  // Find and click the user avatar menu
  const userAvatar = getUserAvatar(page)
  await expect(userAvatar).toBeVisible()
  await userAvatar.click()

  // Wait for dropdown menu and click logout
  const logoutButton = page.getByRole('menuitem', { name: /log out/i })
  await expect(logoutButton).toBeVisible()
  await logoutButton.click()

  // Wait for logout to complete and verify login form appears
  const loginForm = page.locator('shade-login form')
  await expect(loginForm).toBeVisible()
}

export const navigateToUserSettings = async (page: Page) => {
  // Click on the user avatar to open the menu
  const userAvatar = getUserAvatar(page)
  await userAvatar.click()

  // Click on User Settings option
  const settingsButton = page.getByRole('menuitem', { name: /user settings/i })
  await settingsButton.click()

  // Verify we're on the settings page
  const settingsPage = page.locator('user-settings-page')
  await expect(settingsPage).toBeVisible()
}

export const navigateToAppSettings = async (page: Page) => {
  // Click on the user avatar to open the menu
  const userAvatar = getUserAvatar(page)
  await expect(userAvatar).toBeVisible()
  await userAvatar.click()

  // Click on Application Settings option (only visible to admin users)
  const appSettingsButton = page.getByRole('menuitem', { name: /application settings/i })
  await expect(appSettingsButton).toBeVisible()
  await appSettingsButton.click()

  // Wait for URL to change to app-settings
  await page.waitForURL(/\/app-settings/)

  // Verify we're on the app settings page (may need to wait for lazy load)
  const appSettingsPage = page.locator('app-settings-page')
  await expect(appSettingsPage).toBeVisible({ timeout: 10000 })
}

/**
 * @deprecated Use navigateToAppSettings instead
 */
export const navigateToAdminSettings = navigateToAppSettings

export const navigateToUsersSettings = async (page: Page) => {
  await navigateToAppSettings(page)

  // Click on Users menu item in the Identity section
  await page.getByText('Users').click()

  // Wait for URL to change to users list
  await page.waitForURL(/\/app-settings\/users/)

  // Verify we're on the users list page
  const usersListPage = page.locator('user-list-page')
  await expect(usersListPage).toBeVisible({ timeout: 10000 })
}

export const registerUser = async (page: Page, username: string, password: string) => {
  await page.goto('/')

  // Navigate to registration page
  const createAccountButton = page.locator('button', { hasText: 'Create Account' })
  await expect(createAccountButton).toBeVisible()
  await createAccountButton.click()

  // Fill registration form
  const registerForm = page.locator('shade-register form')
  await expect(registerForm).toBeVisible()

  const usernameInput = registerForm.locator('input[name="userName"]')
  const passwordInput = registerForm.locator('input[name="password"]')
  const confirmPasswordInput = registerForm.locator('input[name="confirmPassword"]')
  const createAccountSubmitButton = page.locator('shade-register button', { hasText: 'Create Account' })

  await usernameInput.fill(username)
  await passwordInput.fill(password)
  await confirmPasswordInput.fill(password)
  await createAccountSubmitButton.click()

  // Should be logged in automatically after successful registration
  await assertAndDismissNoty(page, 'Account created successfully')
}

export const uploadFile = async (page: Page, filePath: string, mime: string) => {
  const fileContent = await readFile(filePath, { encoding: 'utf-8' })
  const fileName = basename(filePath)

  const dataTransfer = await page.evaluateHandle(
    async ([fileNameToUpload, type, content]) => {
      const dt = new DataTransfer()
      const file = new File([content], fileNameToUpload, { type })
      dt.items.add(file)
      return dt
    },
    [fileName, mime, fileContent],
  )

  const fileDrop = page.getByTestId('file-drop').first()
  await fileDrop.dispatchEvent('drop', { dataTransfer })

  await assertAndDismissNoty(page, `The files are upploaded succesfully`)

  await dataTransfer.dispose()
}
