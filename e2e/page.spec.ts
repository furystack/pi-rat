import { test, expect } from '@playwright/test'
import { login, logout } from './helpers'

test.describe('Pi-Rat Application', () => {
  test('Login and logout roundtrip', async ({ page }) => {
    await page.goto('/')

    await login(page)

    const defaultDashboard = await page.locator('pi-rat-default-dashboard')
    await expect(defaultDashboard).toBeVisible()
    await expect(defaultDashboard).toContainText('Apps')
    await expect(defaultDashboard).toContainText('Entities')

    await logout(page)
  })
})
