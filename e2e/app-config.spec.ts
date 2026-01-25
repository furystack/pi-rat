import { expect, test } from '@playwright/test'
import { assertAndDismissNoty, login, navigateToAppSettings } from './helpers.js'

test.describe('App Configuration Settings', () => {
  // Run tests serially to prevent parallel execution issues with global singleton settings
  test.describe.configure({ mode: 'serial' })

  test('Admin can configure OMDB settings, toggle visibility, save, and verify persistence', async ({ page }) => {
    // ============================================
    // STEP 1: Login and navigate to app settings
    // ============================================
    await page.goto('/')
    await login(page)
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    // ============================================
    // STEP 2: Verify OMDB settings form structure
    // ============================================
    await expect(page.locator('text=OMDB Settings').first()).toBeVisible()

    const omdbPage = page.locator('omdb-settings-page')
    const apiKeyInput = omdbPage.locator('input[name="apiKey"]')
    const searchCheckbox = omdbPage.locator('input[name="trySearchMovieFromTitle"]')
    const autoDownloadCheckbox = omdbPage.locator('input[name="autoDownloadMetadata"]')
    const saveButton = omdbPage.getByRole('button', { name: /save settings/i })

    await expect(apiKeyInput).toBeVisible()
    await expect(searchCheckbox).toBeVisible()
    await expect(autoDownloadCheckbox).toBeVisible()
    await expect(saveButton).toBeVisible()

    // ============================================
    // STEP 3: Test API key visibility toggle
    // ============================================
    const toggleButton = omdbPage.locator('[data-toggle-visibility]')

    // Initially password should be hidden
    await expect(apiKeyInput).toHaveAttribute('type', 'password')

    // Click toggle to show
    await toggleButton.click()
    await expect(apiKeyInput).toHaveAttribute('type', 'text')

    // Click toggle to hide again
    await toggleButton.click()
    await expect(apiKeyInput).toHaveAttribute('type', 'password')

    // ============================================
    // STEP 4: Record initial values for cleanup
    // ============================================
    const initialApiKey = await apiKeyInput.inputValue()
    const initialSearchChecked = await searchCheckbox.isChecked()
    const initialAutoDownloadChecked = await autoDownloadCheckbox.isChecked()

    // ============================================
    // STEP 5: Fill in and save new settings
    // ============================================
    const testApiKey = `test-api-key-${Date.now()}`
    await apiKeyInput.fill(testApiKey)

    // Ensure checkboxes are in a known state (toggle them if needed)
    if (!initialSearchChecked) {
      await searchCheckbox.check()
    }
    if (!initialAutoDownloadChecked) {
      await autoDownloadCheckbox.check()
    }

    await saveButton.click()
    await assertAndDismissNoty(page, 'OMDB settings saved successfully')

    // ============================================
    // STEP 6: Navigate away and back to verify persistence
    // ============================================
    await page.goto('/')
    await page.waitForSelector('text=Apps')
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    // Verify the API key persisted
    const apiKeyInputAfter = page.locator('omdb-settings-page').locator('input[name="apiKey"]')
    await expect(apiKeyInputAfter).toHaveValue(testApiKey)

    // ============================================
    // STEP 7: Cleanup - restore original values
    // ============================================
    await apiKeyInputAfter.fill(initialApiKey)

    const searchCheckboxAfter = page.locator('omdb-settings-page').locator('input[name="trySearchMovieFromTitle"]')
    const autoDownloadCheckboxAfter = page.locator('omdb-settings-page').locator('input[name="autoDownloadMetadata"]')

    if (initialSearchChecked !== (await searchCheckboxAfter.isChecked())) {
      await searchCheckboxAfter.click()
    }
    if (initialAutoDownloadChecked !== (await autoDownloadCheckboxAfter.isChecked())) {
      await autoDownloadCheckboxAfter.click()
    }

    const saveButtonAfter = page.locator('omdb-settings-page').getByRole('button', { name: /save settings/i })
    await saveButtonAfter.click()
    await assertAndDismissNoty(page, 'OMDB settings saved successfully')
  })

  test('Admin can configure Streaming settings, validate inputs, save, and verify persistence', async ({ page }) => {
    // ============================================
    // STEP 1: Login and navigate to streaming settings
    // ============================================
    await page.goto('/')
    await login(page)
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    const streamingMenuItem = page.getByText('Streaming Settings')
    await streamingMenuItem.click()
    await page.waitForSelector('text=📺 Streaming Settings')

    // ============================================
    // STEP 2: Verify streaming settings form structure
    // ============================================
    await expect(page.locator('text=📺 Streaming Settings').first()).toBeVisible()

    const streamingPage = page.locator('streaming-settings-page')
    const extractSubtitlesCheckbox = streamingPage.locator('input[name="autoExtractSubtitles"]')
    const fullSyncCheckbox = streamingPage.locator('input[name="fullSyncOnStartup"]')
    const watchFilesCheckbox = streamingPage.locator('input[name="watchFiles"]')
    const presetSelect = streamingPage.locator('select[name="preset"]')
    const threadsInput = streamingPage.locator('input[name="threads"]')
    const saveButton = streamingPage.getByRole('button', { name: /save settings/i })

    await expect(extractSubtitlesCheckbox).toBeVisible()
    await expect(fullSyncCheckbox).toBeVisible()
    await expect(watchFilesCheckbox).toBeVisible()
    await expect(presetSelect).toBeVisible()
    await expect(threadsInput).toBeVisible()
    await expect(saveButton).toBeVisible()

    // ============================================
    // STEP 3: Verify input validation attributes
    // ============================================
    await expect(threadsInput).toHaveAttribute('min', '1')
    await expect(threadsInput).toHaveAttribute('max', '64')

    // ============================================
    // STEP 4: Record initial values for cleanup
    // ============================================
    const initialThreads = await threadsInput.inputValue()
    const initialPreset = await presetSelect.inputValue()
    const initialExtractSubtitles = await extractSubtitlesCheckbox.isChecked()

    // ============================================
    // STEP 5: Update settings and save
    // ============================================
    await threadsInput.fill('12')
    await presetSelect.selectOption('veryfast')

    if (!initialExtractSubtitles) {
      await extractSubtitlesCheckbox.check()
    }

    await saveButton.click()
    await assertAndDismissNoty(page, 'Streaming settings saved successfully')

    // ============================================
    // STEP 6: Navigate away and back to verify persistence
    // ============================================
    await page.goto('/')
    await page.waitForSelector('text=Apps')
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    await page.getByText('Streaming Settings').click()
    await page.waitForSelector('text=📺 Streaming Settings')

    const threadsInputAfter = page.locator('streaming-settings-page').locator('input[name="threads"]')
    const presetSelectAfter = page.locator('streaming-settings-page').locator('select[name="preset"]')

    await expect(threadsInputAfter).toHaveValue('12')
    await expect(presetSelectAfter).toHaveValue('veryfast')

    // ============================================
    // STEP 7: Cleanup - restore original values
    // ============================================
    await threadsInputAfter.fill(initialThreads)
    await presetSelectAfter.selectOption(initialPreset)

    const extractSubtitlesAfter = page.locator('streaming-settings-page').locator('input[name="autoExtractSubtitles"]')
    if (initialExtractSubtitles !== (await extractSubtitlesAfter.isChecked())) {
      await extractSubtitlesAfter.click()
    }

    const saveButtonAfter = page.locator('streaming-settings-page').getByRole('button', { name: /save settings/i })
    await saveButtonAfter.click()
    await assertAndDismissNoty(page, 'Streaming settings saved successfully')
  })

  test('Admin can navigate all settings sections and configure IOT and AI settings', async ({ page }) => {
    // ============================================
    // STEP 1: Login and navigate to app settings
    // ============================================
    await page.goto('/')
    await login(page)
    await navigateToAppSettings(page)
    await page.waitForSelector('text=OMDB Settings')

    // Should redirect to /app-settings/omdb by default
    await expect(page).toHaveURL(/\/app-settings\/omdb/)
    await expect(page.locator('text=🎬 OMDB Settings').first()).toBeVisible()

    // ============================================
    // STEP 2: Navigate to Streaming settings
    // ============================================
    await page.getByText('Streaming Settings').click()
    await expect(page).toHaveURL(/\/app-settings\/streaming/)
    await expect(page.locator('text=📺 Streaming Settings').first()).toBeVisible()

    // ============================================
    // STEP 3: Navigate to IOT settings and configure
    // ============================================
    await page.getByText('Device Availability').click()
    await expect(page).toHaveURL(/\/app-settings\/iot/)
    await expect(page.locator('text=📡 IOT Device Availability').first()).toBeVisible()

    const iotPage = page.locator('iot-settings-page')
    const pingIntervalInput = iotPage.locator('input[name="pingIntervalMs"]')
    const pingTimeoutInput = iotPage.locator('input[name="pingTimeoutMs"]')
    const iotSaveButton = iotPage.getByRole('button', { name: /save settings/i })

    await expect(pingIntervalInput).toBeVisible()
    await expect(pingTimeoutInput).toBeVisible()
    await expect(iotSaveButton).toBeVisible()

    // Verify input constraints
    await expect(pingIntervalInput).toHaveAttribute('min', '1000')
    await expect(pingIntervalInput).toHaveAttribute('max', '3600000')
    await expect(pingIntervalInput).toHaveAttribute('type', 'number')
    await expect(pingTimeoutInput).toHaveAttribute('min', '100')
    await expect(pingTimeoutInput).toHaveAttribute('max', '60000')
    await expect(pingTimeoutInput).toHaveAttribute('type', 'number')

    // Record initial values for cleanup
    const initialPingInterval = await pingIntervalInput.inputValue()
    const initialPingTimeout = await pingTimeoutInput.inputValue()

    // Update and save IOT settings
    await pingIntervalInput.fill('60000')
    await pingTimeoutInput.fill('5000')
    await iotSaveButton.click()
    await assertAndDismissNoty(page, 'IOT settings saved successfully')

    // ============================================
    // STEP 4: Navigate to AI settings and configure
    // ============================================
    await page.getByText('Ollama Settings').click()
    await expect(page).toHaveURL(/\/app-settings\/ai/)
    await expect(page.locator('text=🤖 Ollama Integration').first()).toBeVisible()

    const aiPage = page.locator('ai-settings-page')
    const hostInput = aiPage.locator('input[name="host"]')
    const aiSaveButton = aiPage.getByRole('button', { name: /save settings/i })

    await expect(hostInput).toBeVisible()
    await expect(hostInput).toHaveAttribute('type', 'url')
    await expect(aiSaveButton).toBeVisible()

    // Record initial value for cleanup
    const initialHost = await hostInput.inputValue()

    // Test saving with a valid URL
    await hostInput.fill('http://localhost:11434')
    await aiSaveButton.click()
    await assertAndDismissNoty(page, 'AI settings saved successfully')

    // Test saving with empty URL (disable AI)
    await hostInput.fill('')
    await aiSaveButton.click()
    await assertAndDismissNoty(page, 'AI settings saved successfully')

    // ============================================
    // STEP 5: Navigate back to OMDB settings
    // ============================================
    await page.getByText('OMDB Settings').click()
    await expect(page).toHaveURL(/\/app-settings\/omdb/)
    await expect(page.locator('text=🎬 OMDB Settings').first()).toBeVisible()

    // ============================================
    // STEP 6: Cleanup - restore IOT and AI settings
    // ============================================
    // Restore IOT settings
    await page.getByText('Device Availability').click()
    await page.waitForSelector('text=📡 IOT Device Availability')

    const pingIntervalInputCleanup = page.locator('iot-settings-page').locator('input[name="pingIntervalMs"]')
    const pingTimeoutInputCleanup = page.locator('iot-settings-page').locator('input[name="pingTimeoutMs"]')
    const iotSaveButtonCleanup = page.locator('iot-settings-page').getByRole('button', { name: /save settings/i })

    await pingIntervalInputCleanup.fill(initialPingInterval)
    await pingTimeoutInputCleanup.fill(initialPingTimeout)
    await iotSaveButtonCleanup.click()
    await assertAndDismissNoty(page, 'IOT settings saved successfully')

    // Restore AI settings
    await page.getByText('Ollama Settings').click()
    await page.waitForSelector('text=🤖 Ollama Integration')

    const hostInputCleanup = page.locator('ai-settings-page').locator('input[name="host"]')
    const aiSaveButtonCleanup = page.locator('ai-settings-page').getByRole('button', { name: /save settings/i })

    await hostInputCleanup.fill(initialHost)
    await aiSaveButtonCleanup.click()
    await assertAndDismissNoty(page, 'AI settings saved successfully')
  })
})
