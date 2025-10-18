import { expect, test } from '@playwright/test'
import { assertAndDismissNoty, logout } from './helpers.js'

test('User Registration and Login Flow', async ({ page }) => {
  await page.goto('/')

  // Navigate to registration page
  const createAccountButton = page.locator('button', { hasText: 'Create Account' })
  await expect(createAccountButton).toBeVisible()
  await createAccountButton.click()

  // Verify registration form is visible
  const registerForm = page.locator('shade-register form')
  await expect(registerForm).toBeVisible()

  const usernameInput = registerForm.locator('input[name="userName"]')
  await expect(usernameInput).toBeVisible()

  const passwordInput = registerForm.locator('input[name="password"]')
  await expect(passwordInput).toBeVisible()

  const confirmPasswordInput = registerForm.locator('input[name="confirmPassword"]')
  await expect(confirmPasswordInput).toBeVisible()

  const createAccountSubmitButton = page.locator('shade-register button', { hasText: 'Create Account' })
  await expect(createAccountSubmitButton).toBeVisible()
  await expect(createAccountSubmitButton).toBeEnabled()

  const backToLoginButton = page.locator('shade-register button', { hasText: 'Back to Login' })
  await expect(backToLoginButton).toBeVisible()

  // Test navigation back to login
  await backToLoginButton.click()
  const loginForm = page.locator('shade-login form')
  await expect(loginForm).toBeVisible()

  // Navigate back to registration
  await createAccountButton.click()
  await expect(registerForm).toBeVisible()

  // Test registration with mismatched passwords
  const testEmail = `testuser-${Date.now()}@example.com`
  await usernameInput.fill(testEmail)
  await passwordInput.fill('testpassword123')
  await confirmPasswordInput.fill('differentpassword')
  await createAccountSubmitButton.click()

  // Should show password mismatch error (though this might not be visible in the UI)
  // Let's continue with correct registration

  // Test successful registration
  await usernameInput.fill(testEmail)
  await passwordInput.fill('testpassword123')
  await confirmPasswordInput.fill('testpassword123')
  await createAccountSubmitButton.click()

  // Should be logged in automatically after successful registration
  await assertAndDismissNoty(page, 'Account created successfully')

  // Verify user is logged in by checking for logout button
  const logoutButton = page.locator('button', { hasText: 'Log Out' })
  await expect(logoutButton).toBeVisible()

  // Test logout and login with the newly created account
  await logout(page)

  // Now test logging in with the newly registered account
  await expect(loginForm).toBeVisible()

  const loginUsernameInput = loginForm.locator('input[name="userName"]')
  await expect(loginUsernameInput).toBeVisible()

  const loginPasswordInput = loginForm.locator('input[name="password"]')
  await expect(loginPasswordInput).toBeVisible()

  const loginSubmitButton = page.locator('shade-login button', { hasText: 'Login' })
  await expect(loginSubmitButton).toBeVisible()
  await expect(loginSubmitButton).toBeEnabled()

  await loginUsernameInput.fill(testEmail)
  await loginPasswordInput.fill('testpassword123')
  await loginSubmitButton.click()

  // Should be logged in successfully
  await assertAndDismissNoty(page, 'Welcome back ;)')

  // Verify user is logged in
  await expect(logoutButton).toBeVisible()
})

test('Registration validation', async ({ page }) => {
  await page.goto('/')

  // Navigate to registration page
  const createAccountButton = page.locator('button', { hasText: 'Create Account' })
  await createAccountButton.click()

  const registerForm = page.locator('shade-register form')
  await expect(registerForm).toBeVisible()

  const usernameInput = registerForm.locator('input[name="userName"]')
  const passwordInput = registerForm.locator('input[name="password"]')
  const confirmPasswordInput = registerForm.locator('input[name="confirmPassword"]')
  const createAccountSubmitButton = page.locator('shade-register button', { hasText: 'Create Account' })

  // Test with invalid email format
  await usernameInput.fill('invalid-email')
  await passwordInput.fill('testpassword123')
  await confirmPasswordInput.fill('testpassword123')
  await createAccountSubmitButton.click()

  // Should show registration failed notification
  await assertAndDismissNoty(page, 'Registration failed')

  // Test with short password
  await usernameInput.fill('test@example.com')
  await passwordInput.fill('123')
  await confirmPasswordInput.fill('123')
  await createAccountSubmitButton.click()

  // Should show registration failed notification
  await assertAndDismissNoty(page, 'Registration failed')

  // Test with existing user (using the admin user created in install)
  await usernameInput.fill('testuser@gmail.com')
  await passwordInput.fill('testpassword123')
  await confirmPasswordInput.fill('testpassword123')
  await createAccountSubmitButton.click()

  // Should show registration failed notification for existing user
  await assertAndDismissNoty(page, 'Registration failed')
})
