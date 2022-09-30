import { test, expect } from '@playwright/test'

test.describe('Example Application', () => {
  test('Login and logout roundtrip', async ({ page }) => {
    await page.goto('http://localhost:9090')

    const loginForm = await page.locator('shade-login form')
    await expect(loginForm).toBeVisible()

    const usernameInput = await loginForm.locator('input[name="username"]')
    await expect(usernameInput).toBeVisible()

    const passwordInput = await loginForm.locator('input[name="password"]')
    await expect(passwordInput).toBeVisible()

    const submitButton = await page.locator('shade-login button')
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeEnabled()
    await expect(submitButton).toHaveText('Login')

    await usernameInput.type('testuser@gmail.com')
    await passwordInput.type('password')

    await submitButton.click()

    const welcomeTitle = await page.locator('hello-world div h2')
    await expect(welcomeTitle).toBeVisible()
    await expect(welcomeTitle).toHaveText('Hello, testuser@gmail.com !')

    const logoutButton = await page.locator('shade-app-bar shade-button button >> text="Log Out"')
    await expect(logoutButton).toBeVisible()
    await expect(logoutButton).toBeEnabled()
    await expect(logoutButton).toHaveText('Log Out')
    await logoutButton.click()

    const loggedOutLoginForm = await page.locator('shade-login form')
    await expect(loggedOutLoginForm).toBeVisible()
  })
})
