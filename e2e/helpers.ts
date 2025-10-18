import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { readFile } from 'fs/promises'
import { basename } from 'path'

export const assertAndDismissNoty = async (page: Page, text: string) => {
  const noty = page.locator('shade-noty', { hasText: text })
  const closeNoty = noty.locator('button.dismissNoty')
  await closeNoty.click()
  await noty.waitFor({ state: 'detached' })
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

export const logout = async (page: Page) => {
  // Find and click the user avatar (circular div with user's first letter)
  const userAvatar = page.locator('[style*="border-radius: 50%"][style*="cursor: pointer"]')
  await expect(userAvatar).toBeVisible()
  await userAvatar.click()

  // Wait for dropdown menu and click logout - use getByRole for better accessibility
  const logoutButton = page.getByRole('button', { name: /log out/i })
  await expect(logoutButton).toBeVisible()
  await logoutButton.click()

  // Wait for logout to complete and verify login form appears
  const loginForm = page.locator('shade-login form')
  await expect(loginForm).toBeVisible()
}

export const navigateToUserSettings = async (page: Page) => {
  // Click on the user avatar to open the menu
  const userAvatar = page.locator('[style*="border-radius: 50%"][style*="cursor: pointer"]')
  await userAvatar.click()

  // Click on Settings option
  const settingsButton = page.getByRole('button', { name: /settings/i })
  await settingsButton.click()

  // Verify we're on the settings page
  const settingsPage = page.locator('user-settings-page')
  await expect(settingsPage).toBeVisible()
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
