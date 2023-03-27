import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

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

  await usernameInput.type(username)
  await passwordInput.type(password)

  await submitButton.click()

  await page.locator('button', { hasText: 'Log Out' })
}
