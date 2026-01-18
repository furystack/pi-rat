import { expect, test } from '@playwright/test'
import { assertAndDismissNoty, login, navigateToAppSettings } from './helpers.js'

test.describe('OMDB Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await login(page)
    await navigateToAppSettings(page)
    // Wait for the OMDB settings page to load
    await page.waitForSelector('text=OMDB Settings')
  })

  test('should display OMDB settings form', async ({ page }) => {
    // Verify OMDB settings heading is visible (using text selector to pierce shadow DOM)
    await expect(page.locator('text=OMDB Settings').first()).toBeVisible()

    // Verify form fields are present (use locator chain through shadow DOM)
    const omdbPage = page.locator('omdb-settings-page')
    const apiKeyInput = omdbPage.locator('input[name="apiKey"]')
    await expect(apiKeyInput).toBeVisible()

    const searchCheckbox = omdbPage.locator('input[name="trySearchMovieFromTitle"]')
    await expect(searchCheckbox).toBeVisible()

    const autoDownloadCheckbox = omdbPage.locator('input[name="autoDownloadMetadata"]')
    await expect(autoDownloadCheckbox).toBeVisible()

    const saveButton = omdbPage.getByRole('button', { name: /save settings/i })
    await expect(saveButton).toBeVisible()
  })

  test('should toggle API key visibility', async ({ page }) => {
    const omdbPage = page.locator('omdb-settings-page')
    const apiKeyInput = omdbPage.locator('input[name="apiKey"]')
    const toggleButton = omdbPage.locator('[data-toggle-visibility]')

    // Initially password should be hidden
    await expect(apiKeyInput).toHaveAttribute('type', 'password')

    // Click toggle to show
    await toggleButton.click()
    await expect(apiKeyInput).toHaveAttribute('type', 'text')

    // Click toggle to hide again
    await toggleButton.click()
    await expect(apiKeyInput).toHaveAttribute('type', 'password')
  })

  test('should save OMDB settings successfully', async ({ page }) => {
    const omdbPage = page.locator('omdb-settings-page')
    const apiKeyInput = omdbPage.locator('input[name="apiKey"]')
    const searchCheckbox = omdbPage.locator('input[name="trySearchMovieFromTitle"]')
    const autoDownloadCheckbox = omdbPage.locator('input[name="autoDownloadMetadata"]')

    // Fill in the form
    await apiKeyInput.fill('test-api-key-e2e')

    // Ensure checkboxes are in a known state
    if (!(await searchCheckbox.isChecked())) {
      await searchCheckbox.check()
    }
    if (!(await autoDownloadCheckbox.isChecked())) {
      await autoDownloadCheckbox.check()
    }

    // Submit the form
    const saveButton = omdbPage.getByRole('button', { name: /save settings/i })
    await saveButton.click()

    // Verify success notification
    await assertAndDismissNoty(page, 'OMDB settings saved successfully')
  })

  test('should persist OMDB settings after save', async ({ page }) => {
    const omdbPage = page.locator('omdb-settings-page')
    const apiKeyInput = omdbPage.locator('input[name="apiKey"]')

    // Fill in a unique API key
    const testApiKey = `test-api-key-${Date.now()}`
    await apiKeyInput.fill(testApiKey)

    // Submit the form
    const saveButton = omdbPage.getByRole('button', { name: /save settings/i })
    await saveButton.click()
    await assertAndDismissNoty(page, 'OMDB settings saved successfully')

    // Navigate away and back (simulates leaving and returning)
    await page.goto('/')
    await page.waitForSelector('text=Apps')

    // Navigate back to OMDB settings
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    // Verify the value is persisted
    const apiKeyInputAfter = page.locator('omdb-settings-page').locator('input[name="apiKey"]')
    await expect(apiKeyInputAfter).toHaveValue(testApiKey)
  })
})

test.describe('Streaming Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await login(page)
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    // Navigate to streaming settings
    const streamingMenuItem = page.getByText('Streaming Settings')
    await streamingMenuItem.click()
    await page.waitForSelector('text=📺 Streaming Settings')
  })

  test('should display streaming settings form', async ({ page }) => {
    // Verify streaming settings heading (using text selector to pierce shadow DOM)
    await expect(page.locator('text=📺 Streaming Settings').first()).toBeVisible()

    const streamingPage = page.locator('streaming-settings-page')

    // Verify form fields are present
    const extractSubtitlesCheckbox = streamingPage.locator('input[name="autoExtractSubtitles"]')
    await expect(extractSubtitlesCheckbox).toBeVisible()

    const fullSyncCheckbox = streamingPage.locator('input[name="fullSyncOnStartup"]')
    await expect(fullSyncCheckbox).toBeVisible()

    const watchFilesCheckbox = streamingPage.locator('input[name="watchFiles"]')
    await expect(watchFilesCheckbox).toBeVisible()

    const presetSelect = streamingPage.locator('select[name="preset"]')
    await expect(presetSelect).toBeVisible()

    const threadsInput = streamingPage.locator('input[name="threads"]')
    await expect(threadsInput).toBeVisible()

    const saveButton = streamingPage.getByRole('button', { name: /save settings/i })
    await expect(saveButton).toBeVisible()
  })

  test('should save streaming settings successfully', async ({ page }) => {
    const streamingPage = page.locator('streaming-settings-page')
    const extractSubtitlesCheckbox = streamingPage.locator('input[name="autoExtractSubtitles"]')
    const presetSelect = streamingPage.locator('select[name="preset"]')
    const threadsInput = streamingPage.locator('input[name="threads"]')

    // Toggle checkbox
    if (!(await extractSubtitlesCheckbox.isChecked())) {
      await extractSubtitlesCheckbox.check()
    }

    // Select preset
    await presetSelect.selectOption('fast')

    // Set threads
    await threadsInput.fill('8')

    // Submit the form
    const saveButton = streamingPage.getByRole('button', { name: /save settings/i })
    await saveButton.click()

    // Verify success notification
    await assertAndDismissNoty(page, 'Streaming settings saved successfully')
  })

  test('should persist streaming settings after save', async ({ page }) => {
    const streamingPage = page.locator('streaming-settings-page')
    const threadsInput = streamingPage.locator('input[name="threads"]')
    const presetSelect = streamingPage.locator('select[name="preset"]')

    // Set specific values
    await threadsInput.fill('12')
    await presetSelect.selectOption('veryfast')

    // Submit the form
    const saveButton = streamingPage.getByRole('button', { name: /save settings/i })
    await saveButton.click()
    await assertAndDismissNoty(page, 'Streaming settings saved successfully')

    // Navigate away and back (simulates leaving and returning)
    await page.goto('/')
    await page.waitForSelector('text=Apps')

    // Navigate back to app settings
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    // Navigate to streaming settings
    const streamingMenuItem = page.getByText('Streaming Settings')
    await streamingMenuItem.click()
    await page.waitForSelector('text=📺 Streaming Settings')

    // Verify the values are persisted
    const threadsInputAfter = page.locator('streaming-settings-page').locator('input[name="threads"]')
    const presetSelectAfter = page.locator('streaming-settings-page').locator('select[name="preset"]')
    await expect(threadsInputAfter).toHaveValue('12')
    await expect(presetSelectAfter).toHaveValue('veryfast')
  })

  test('should validate threads input', async ({ page }) => {
    const streamingPage = page.locator('streaming-settings-page')
    const threadsInput = streamingPage.locator('input[name="threads"]')

    // Verify min/max attributes
    await expect(threadsInput).toHaveAttribute('min', '1')
    await expect(threadsInput).toHaveAttribute('max', '64')
  })
})

test.describe('IOT Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await login(page)
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    // Navigate to IOT settings
    const iotMenuItem = page.getByText('Device Availability')
    await iotMenuItem.click()
    await page.waitForSelector('text=📡 IOT Device Availability')
  })

  test('should display IOT settings form', async ({ page }) => {
    // Verify IOT settings heading (using text selector to pierce shadow DOM)
    await expect(page.locator('text=📡 IOT Device Availability').first()).toBeVisible()

    const iotPage = page.locator('iot-settings-page')

    // Verify form fields are present
    const pingIntervalInput = iotPage.locator('input[name="pingIntervalMs"]')
    await expect(pingIntervalInput).toBeVisible()

    const pingTimeoutInput = iotPage.locator('input[name="pingTimeoutMs"]')
    await expect(pingTimeoutInput).toBeVisible()

    const saveButton = iotPage.getByRole('button', { name: /save settings/i })
    await expect(saveButton).toBeVisible()
  })

  test('should validate ping interval input constraints', async ({ page }) => {
    const iotPage = page.locator('iot-settings-page')
    const pingIntervalInput = iotPage.locator('input[name="pingIntervalMs"]')

    // Verify min/max attributes
    await expect(pingIntervalInput).toHaveAttribute('min', '1000')
    await expect(pingIntervalInput).toHaveAttribute('max', '3600000')
    await expect(pingIntervalInput).toHaveAttribute('type', 'number')
  })

  test('should validate ping timeout input constraints', async ({ page }) => {
    const iotPage = page.locator('iot-settings-page')
    const pingTimeoutInput = iotPage.locator('input[name="pingTimeoutMs"]')

    // Verify min/max attributes
    await expect(pingTimeoutInput).toHaveAttribute('min', '100')
    await expect(pingTimeoutInput).toHaveAttribute('max', '60000')
    await expect(pingTimeoutInput).toHaveAttribute('type', 'number')
  })

  test('should save IOT settings successfully', async ({ page }) => {
    const iotPage = page.locator('iot-settings-page')
    const pingIntervalInput = iotPage.locator('input[name="pingIntervalMs"]')
    const pingTimeoutInput = iotPage.locator('input[name="pingTimeoutMs"]')

    // Set valid values
    await pingIntervalInput.fill('60000')
    await pingTimeoutInput.fill('5000')

    // Submit the form
    const saveButton = iotPage.getByRole('button', { name: /save settings/i })
    await saveButton.click()

    // Verify success notification
    await assertAndDismissNoty(page, 'IOT settings saved successfully')
  })

  test('should persist IOT settings after save', async ({ page }) => {
    const iotPage = page.locator('iot-settings-page')
    const pingIntervalInput = iotPage.locator('input[name="pingIntervalMs"]')
    const pingTimeoutInput = iotPage.locator('input[name="pingTimeoutMs"]')

    // Set specific values
    await pingIntervalInput.fill('45000')
    await pingTimeoutInput.fill('4500')

    // Submit the form
    const saveButton = iotPage.getByRole('button', { name: /save settings/i })
    await saveButton.click()
    await assertAndDismissNoty(page, 'IOT settings saved successfully')

    // Navigate away and back
    await page.goto('/')
    await page.waitForSelector('text=Apps')

    // Navigate back to IOT settings
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    const iotMenuItemAfter = page.getByText('Device Availability')
    await iotMenuItemAfter.click()
    await page.waitForSelector('text=📡 IOT Device Availability')

    // Verify the values are persisted
    const pingIntervalInputAfter = page.locator('iot-settings-page').locator('input[name="pingIntervalMs"]')
    const pingTimeoutInputAfter = page.locator('iot-settings-page').locator('input[name="pingTimeoutMs"]')
    await expect(pingIntervalInputAfter).toHaveValue('45000')
    await expect(pingTimeoutInputAfter).toHaveValue('4500')
  })

  test('should show validation error when timeout is greater than interval', async ({ page }) => {
    const iotPage = page.locator('iot-settings-page')
    const pingIntervalInput = iotPage.locator('input[name="pingIntervalMs"]')
    const pingTimeoutInput = iotPage.locator('input[name="pingTimeoutMs"]')

    // Set invalid values (timeout >= interval)
    await pingIntervalInput.fill('5000')
    await pingTimeoutInput.fill('5000')

    // Submit the form
    const saveButton = iotPage.getByRole('button', { name: /save settings/i })
    await saveButton.click()

    // Verify validation error is shown
    const validationError = iotPage.locator('[data-testid="validation-error"]')
    await expect(validationError).toBeVisible()
    await expect(validationError).toContainText('Ping timeout must be less than ping interval')
  })
})

test.describe('AI Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await login(page)
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    // Navigate to AI settings
    const aiMenuItem = page.getByText('Ollama Settings')
    await aiMenuItem.click()
    await page.waitForSelector('text=🤖 Ollama Integration')
  })

  test('should display AI settings form', async ({ page }) => {
    // Verify AI settings heading (using text selector to pierce shadow DOM)
    await expect(page.locator('text=🤖 Ollama Integration').first()).toBeVisible()

    const aiPage = page.locator('ai-settings-page')

    // Verify form fields are present
    const hostInput = aiPage.locator('input[name="host"]')
    await expect(hostInput).toBeVisible()
    await expect(hostInput).toHaveAttribute('type', 'url')

    const saveButton = aiPage.getByRole('button', { name: /save settings/i })
    await expect(saveButton).toBeVisible()
  })

  test('should save AI settings successfully with valid URL', async ({ page }) => {
    const aiPage = page.locator('ai-settings-page')
    const hostInput = aiPage.locator('input[name="host"]')

    // Set a valid URL
    await hostInput.fill('http://localhost:11434')

    // Submit the form
    const saveButton = aiPage.getByRole('button', { name: /save settings/i })
    await saveButton.click()

    // Verify success notification
    await assertAndDismissNoty(page, 'AI settings saved successfully')
  })

  test('should save AI settings successfully with empty URL (disable AI)', async ({ page }) => {
    const aiPage = page.locator('ai-settings-page')
    const hostInput = aiPage.locator('input[name="host"]')

    // Clear the URL to disable AI features
    await hostInput.fill('')

    // Submit the form
    const saveButton = aiPage.getByRole('button', { name: /save settings/i })
    await saveButton.click()

    // Verify success notification
    await assertAndDismissNoty(page, 'AI settings saved successfully')
  })

  test('should persist AI settings after save', async ({ page }) => {
    const aiPage = page.locator('ai-settings-page')
    const hostInput = aiPage.locator('input[name="host"]')

    // Set a specific URL
    const testUrl = 'http://my-ollama-server:8080'
    await hostInput.fill(testUrl)

    // Submit the form
    const saveButton = aiPage.getByRole('button', { name: /save settings/i })
    await saveButton.click()
    await assertAndDismissNoty(page, 'AI settings saved successfully')

    // Navigate away and back
    await page.goto('/')
    await page.waitForSelector('text=Apps')

    // Navigate back to AI settings
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    const aiMenuItemAfter = page.getByText('Ollama Settings')
    await aiMenuItemAfter.click()
    await page.waitForSelector('text=🤖 Ollama Integration')

    // Verify the value is persisted
    const hostInputAfter = page.locator('ai-settings-page').locator('input[name="host"]')
    await expect(hostInputAfter).toHaveValue(testUrl)
  })

  test('should show validation error for invalid URL', async ({ page }) => {
    const aiPage = page.locator('ai-settings-page')
    const hostInput = aiPage.locator('input[name="host"]')

    // Set an invalid URL
    await hostInput.fill('not-a-valid-url')

    // Submit the form
    const saveButton = aiPage.getByRole('button', { name: /save settings/i })
    await saveButton.click()

    // Verify validation error is shown
    const validationError = aiPage.locator('[data-testid="validation-error"]')
    await expect(validationError).toBeVisible()
    await expect(validationError).toContainText('Please enter a valid URL')
  })
})

test.describe('Settings Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await login(page)
  })

  test('should navigate between OMDB and Streaming settings', async ({ page }) => {
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    // Verify we're on OMDB settings by default (using text selector to pierce shadow DOM)
    await expect(page.locator('text=🎬 OMDB Settings').first()).toBeVisible()

    // Navigate to Streaming settings
    const streamingMenuItem = page.getByText('Streaming Settings')
    await streamingMenuItem.click()
    await page.waitForSelector('text=📺 Streaming Settings')

    await expect(page.locator('text=📺 Streaming Settings').first()).toBeVisible()

    // Navigate back to OMDB settings
    const omdbMenuItem = page.getByText('OMDB Settings')
    await omdbMenuItem.click()
    await page.waitForSelector('text=🎬 OMDB Settings')

    await expect(page.locator('text=🎬 OMDB Settings').first()).toBeVisible()
  })

  test('should navigate to all settings sections', async ({ page }) => {
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    // Navigate to IOT settings
    const iotMenuItem = page.getByText('Device Availability')
    await iotMenuItem.click()
    await expect(page).toHaveURL(/\/app-settings\/iot/)
    await expect(page.locator('text=📡 IOT Device Availability').first()).toBeVisible()

    // Navigate to AI settings
    const aiMenuItem = page.getByText('Ollama Settings')
    await aiMenuItem.click()
    await expect(page).toHaveURL(/\/app-settings\/ai/)
    await expect(page.locator('text=🤖 Ollama Integration').first()).toBeVisible()

    // Navigate back to OMDB
    const omdbMenuItem = page.getByText('OMDB Settings')
    await omdbMenuItem.click()
    await expect(page).toHaveURL(/\/app-settings\/omdb/)
    await expect(page.locator('text=🎬 OMDB Settings').first()).toBeVisible()
  })

  test('should highlight active menu item', async ({ page }) => {
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    // Check that OMDB menu item is visible
    const omdbMenuItem = page.locator('settings-menu-item').filter({ hasText: 'OMDB Settings' })
    await expect(omdbMenuItem).toBeVisible()

    // Navigate to streaming
    const streamingMenuItem = page.getByText('Streaming Settings')
    await streamingMenuItem.click()

    // Verify URL changed
    await expect(page).toHaveURL(/\/app-settings\/streaming/)
  })

  test('should redirect from base /app-settings to /app-settings/omdb', async ({ page }) => {
    // Navigate to app settings via UI and verify default sub-route
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    // Should be on the omdb settings sub-route
    await expect(page).toHaveURL(/\/app-settings\/omdb/)
  })
})
