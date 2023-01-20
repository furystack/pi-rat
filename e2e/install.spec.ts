import { test, expect } from '@playwright/test'

test('Setup Project @install', async ({ page }) => {
  await page.goto('http://localhost:9090')

  const welcomeText = await page.locator('h1', { hasText: 'Welcome to PI-RAT Installer' })
  await expect(welcomeText).toBeVisible()
  const nextButton1 = await page.locator('shade-button', { hasText: 'Next' })
  await expect(nextButton1).toBeVisible()
  await nextButton1.click()

  const createAdminStep = await page.locator('create-admin-step')
  const userForm = await createAdminStep.locator('form')
  expect(userForm).toBeVisible()

  const usernameInput = await userForm.locator('input[name="username"]')
  await expect(usernameInput).toBeVisible()

  const passwordInput = await userForm.locator('input[name="password"]')
  await expect(passwordInput).toBeVisible()

  const confirmPasswordInput = await userForm.locator('input[name="confirmPassword"]')
  await expect(passwordInput).toBeVisible()

  const submitButton = await page.locator('shade-button', { hasText: 'next' })
  await expect(submitButton).toBeVisible()
  await expect(submitButton).toBeEnabled()
  await expect(submitButton).toHaveText('Next')

  await usernameInput.type('testuser@gmail.com')
  await passwordInput.type('password')
  await confirmPasswordInput.type('password')

  await submitButton.click()

  const allDoneTitle = await page.locator('h1', { hasText: 'All Done!' })
  await expect(allDoneTitle).toBeVisible()
  const finishButton = await page.locator('shade-button', { hasText: 'Finish' })
  await expect(finishButton).toBeVisible()
  finishButton.click()

  await page.waitForNavigation()

  const loginForm = await page.locator('shade-login form')
  await expect(loginForm).toBeVisible()
})
