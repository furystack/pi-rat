import { expect, test } from '@playwright/test'
import { login } from './helpers.js'

test('Setup Project @install', async ({ page }) => {
  await page.goto('/')

  const welcomeText = page.locator('h1', { hasText: 'Welcome to PI-RAT Installer' })
  await expect(welcomeText).toBeVisible()
  const nextButton1 = page.locator('button', { hasText: 'Next' })
  await expect(nextButton1).toBeVisible()
  await nextButton1.click()

  const createAdminStep = page.locator('create-admin-step')
  const userForm = createAdminStep.locator('form')
  await expect(userForm).toBeVisible()

  const usernameInput = userForm.locator('input[name="userName"]')
  await expect(usernameInput).toBeVisible()

  const passwordInput = userForm.locator('input[name="password"]')
  await expect(passwordInput).toBeVisible()

  const confirmPasswordInput = userForm.locator('input[name="confirmPassword"]')
  await expect(passwordInput).toBeVisible()

  const submitButton = page.locator('button', { hasText: 'next' })
  await expect(submitButton).toBeVisible()
  await expect(submitButton).toBeEnabled()
  await expect(submitButton).toHaveText('Next')

  await usernameInput.fill('testuser@gmail.com')
  await passwordInput.fill('password')
  await confirmPasswordInput.fill('password')

  await submitButton.click()

  const allDoneTitle = page.locator('h1', { hasText: 'All Done!' })
  await expect(allDoneTitle).toBeVisible()
  const finishButton = page.locator('button', { hasText: 'Finish' })
  await expect(finishButton).toBeVisible()
  await finishButton.click()

  await page.waitForNavigation()

  await login(page, 'testuser@gmail.com', 'password')
})
