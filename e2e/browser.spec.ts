import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Browser', () => {
  test('Should be able to create a drive in the temp directory', async ({ page }) => {
    await page.goto('/')

    await login(page)

    const driveShortcut = await page.locator('route-link', { hasText: '💽 Browser' })
    expect(driveShortcut).toBeVisible()
  })
})
