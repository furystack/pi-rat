import { test, expect } from './fixtures.js'
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

  // Test registration with mismatched passwords - client-side validation should prevent submission
  const testEmail = `testuser-${Date.now()}@example.com`
  await usernameInput.fill(testEmail)
  await passwordInput.fill('testpassword123')
  await confirmPasswordInput.fill('differentpassword')
  await createAccountSubmitButton.click()

  // Form validation should prevent submission, so we should still be on registration page
  await expect(registerForm).toBeVisible()
  // Continue with correct registration

  // Test successful registration
  await usernameInput.fill(testEmail)
  await passwordInput.fill('testpassword123')
  await confirmPasswordInput.fill('testpassword123')
  await createAccountSubmitButton.click()

  // Should be logged in automatically after successful registration
  await assertAndDismissNoty(page, 'Account created successfully')

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

  // Verify user is logged in by checking for user avatar with first letter
  const firstLetter = testEmail.charAt(0).toUpperCase()
  const userAvatar = page.getByText(firstLetter).first()
  await expect(userAvatar).toBeVisible()
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

  // Test with invalid email format - browser validation should prevent submission
  await usernameInput.fill('invalid-email')
  await passwordInput.fill('testpassword123')
  await confirmPasswordInput.fill('testpassword123')

  // Check that email input shows validation error
  await expect(usernameInput).toHaveJSProperty('validity.valid', false)
  await expect(usernameInput).toHaveJSProperty('validity.typeMismatch', true)

  // Test with short password - HTML5 validation should prevent submission
  await usernameInput.fill('test@example.com')
  await passwordInput.fill('123')
  await confirmPasswordInput.fill('123')

  // Check that password inputs show validation errors for minlength
  await expect(passwordInput).toHaveJSProperty('validity.valid', false)
  await expect(passwordInput).toHaveJSProperty('validity.tooShort', true)
  await expect(confirmPasswordInput).toHaveJSProperty('validity.valid', false)
  await expect(confirmPasswordInput).toHaveJSProperty('validity.tooShort', true)

  // Test with mismatched passwords - form validation should disable submit
  await usernameInput.fill('test@example.com')
  await passwordInput.fill('testpassword123')
  await confirmPasswordInput.fill('differentpassword')

  // The form should be invalid due to password mismatch, button should be disabled
  // (This depends on the Form component implementation, may need adjustment)
  await createAccountSubmitButton.click()
  // Form validation should prevent submission, so we should still be on registration page
  await expect(registerForm).toBeVisible()

  // Test with existing user (this is the only case that reaches server validation)
  await usernameInput.fill('testuser@gmail.com')
  await passwordInput.fill('testpassword123')
  await confirmPasswordInput.fill('testpassword123')
  await createAccountSubmitButton.click()

  // Should show registration failed notification for existing user
  await assertAndDismissNoty(page, 'Registration failed')
})
