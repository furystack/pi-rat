import { test, expect } from '@playwright/test'
import { login, logout } from './helpers'

test.describe('Pi-Rat Application', () => {
  test('Login and logout roundtrip', async ({ page }) => {
    await page.goto('/')

    await login(page)

    const welcomeTitle = await page.locator('hello-world div h2')
    await expect(welcomeTitle).toBeVisible()
    await expect(welcomeTitle).toHaveText('Hello, testuser@gmail.com !')

    await logout(page)
  })
})
