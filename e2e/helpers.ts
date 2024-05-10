import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { basename } from 'path'
import { readFile } from 'fs/promises'

export const assertAndDismissNoty = async (page: Page, text: string) => {
  const noty = await page.locator('shade-noty', { hasText: text })
  const closeNoty = await noty.locator('button.dismissNoty')
  await closeNoty.click()
  await noty.waitFor({ state: 'detached' })
}

export const login = async (page: Page, username = 'testuser@gmail.com', password = 'password') => {
  const loginForm = await page.locator('shade-login form')
  await expect(loginForm).toBeVisible()

  const usernameInput = await loginForm.locator('input[name="userName"]')
  await expect(usernameInput).toBeVisible()

  const passwordInput = await loginForm.locator('input[name="password"]')
  await expect(passwordInput).toBeVisible()

  const submitButton = await page.locator('shade-login button', { hasText: 'Login' })
  await expect(submitButton).toBeVisible()
  await expect(submitButton).toBeEnabled()
  await expect(submitButton).toHaveText('Login')

  await usernameInput.fill(username)
  await passwordInput.fill(password)

  await submitButton.click()

  await assertAndDismissNoty(page, 'Welcome back ;)')

  await page.locator('button', { hasText: 'Log Out' })
}

export const logout = async (page: Page) => {
  const logoutButton = await page.locator('shade-app-bar button', { hasText: 'Log Out' })
  await expect(logoutButton).toBeVisible()
  await expect(logoutButton).toBeEnabled()
  await expect(logoutButton).toHaveText('Log Out')
  await logoutButton.click()

  const loggedOutLoginForm = await page.locator('shade-login form.login-form')
  await expect(loggedOutLoginForm).toBeVisible()
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

  const fileDrop = await page.getByTestId('file-drop').first()
  await fileDrop.dispatchEvent('drop', { dataTransfer })

  await assertAndDismissNoty(page, `The files are upploaded succesfully`)

  await dataTransfer.dispose()
}
