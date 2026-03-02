import { test, expect } from './fixtures.js'
import { assertAndDismissNoty, login, navigateToAppSettings } from './helpers.js'

const PRESET_LABELS: Record<string, string> = {
  ultrafast: 'Ultra Fast',
  superfast: 'Super Fast',
  veryfast: 'Very Fast',
  faster: 'Faster',
  fast: 'Fast',
  medium: 'Medium (Balanced)',
  slow: 'Slow',
  slower: 'Slower',
  veryslow: 'Very Slow (Best Quality)',
}

test.describe('App Configuration Settings', () => {
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
    const searchSwitch = omdbPage
      .locator('shade-switch')
      .filter({ has: page.locator('input[name="trySearchMovieFromTitle"]') })
    const autoDownloadSwitch = omdbPage
      .locator('shade-switch')
      .filter({ has: page.locator('input[name="autoDownloadMetadata"]') })
    const saveButton = omdbPage.getByRole('button', { name: /save settings/i })

    await expect(apiKeyInput).toBeVisible()
    await expect(searchSwitch).toBeVisible()
    await expect(autoDownloadSwitch).toBeVisible()
    await expect(saveButton).toBeVisible()

    // ============================================
    // STEP 3: Test API key visibility toggle
    // ============================================
    // Initially password should be hidden
    await expect(apiKeyInput).toHaveAttribute('type', 'password')

    // Click toggle to show
    await omdbPage.getByRole('button', { name: /show/i }).click()
    await expect(apiKeyInput).toHaveAttribute('type', 'text')

    // Click toggle to hide again
    await omdbPage.getByRole('button', { name: /hide/i }).click()
    await expect(apiKeyInput).toHaveAttribute('type', 'password')

    // ============================================
    // STEP 4: Record initial values for cleanup
    // ============================================
    const initialApiKey = await apiKeyInput.inputValue()
    const searchCheckboxInput = searchSwitch.locator('input[type="checkbox"]')
    const autoDownloadCheckboxInput = autoDownloadSwitch.locator('input[type="checkbox"]')
    const initialSearchChecked = await searchCheckboxInput.isChecked()
    const initialAutoDownloadChecked = await autoDownloadCheckboxInput.isChecked()

    // ============================================
    // STEP 5: Fill in and save new settings
    // ============================================
    const testApiKey = `test-api-key-${Date.now()}`
    await apiKeyInput.fill(testApiKey)

    // Ensure switches are in a known state (toggle them if needed)
    if (!initialSearchChecked) {
      await searchSwitch.click()
    }
    if (!initialAutoDownloadChecked) {
      await autoDownloadSwitch.click()
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

    const searchSwitchAfter = page
      .locator('omdb-settings-page')
      .locator('shade-switch')
      .filter({ has: page.locator('input[name="trySearchMovieFromTitle"]') })
    const autoDownloadSwitchAfter = page
      .locator('omdb-settings-page')
      .locator('shade-switch')
      .filter({ has: page.locator('input[name="autoDownloadMetadata"]') })

    const searchCheckboxAfter = searchSwitchAfter.locator('input[type="checkbox"]')
    const autoDownloadCheckboxAfter = autoDownloadSwitchAfter.locator('input[type="checkbox"]')

    if (initialSearchChecked !== (await searchCheckboxAfter.isChecked())) {
      await searchSwitchAfter.click()
    }
    if (initialAutoDownloadChecked !== (await autoDownloadCheckboxAfter.isChecked())) {
      await autoDownloadSwitchAfter.click()
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
    await page.waitForSelector('text=Streaming Settings')

    // ============================================
    // STEP 2: Verify streaming settings form structure
    // ============================================
    await expect(page.locator('text=Streaming Settings').first()).toBeVisible()

    const streamingPage = page.locator('streaming-settings-page')
    const extractSubtitlesSwitch = streamingPage
      .locator('shade-switch')
      .filter({ has: page.locator('input[name="autoExtractSubtitles"]') })
    const fullSyncSwitch = streamingPage
      .locator('shade-switch')
      .filter({ has: page.locator('input[name="fullSyncOnStartup"]') })
    const watchFilesSwitch = streamingPage
      .locator('shade-switch')
      .filter({ has: page.locator('input[name="watchFiles"]') })
    const presetSelect = streamingPage.locator('shade-select').filter({ has: page.locator('input[name="preset"]') })
    const threadsInput = streamingPage.locator('input[name="threads"]')
    const saveButton = streamingPage.getByRole('button', { name: /save settings/i })

    await expect(extractSubtitlesSwitch).toBeVisible()
    await expect(fullSyncSwitch).toBeVisible()
    await expect(watchFilesSwitch).toBeVisible()
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
    const presetHiddenInput = presetSelect.locator('input[type="hidden"]')
    const initialPreset = await presetHiddenInput.inputValue()
    const extractSubtitlesCheckbox = extractSubtitlesSwitch.locator('input[type="checkbox"]')
    const initialExtractSubtitles = await extractSubtitlesCheckbox.isChecked()

    // ============================================
    // STEP 5: Update settings and save
    // ============================================
    await threadsInput.fill('12')

    // Open the preset dropdown and select 'veryfast'
    await presetSelect.locator('[role="combobox"]').click()
    await presetSelect.locator('[role="option"]', { hasText: 'Very Fast' }).click()

    if (!initialExtractSubtitles) {
      await extractSubtitlesSwitch.click()
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
    await page.waitForSelector('text=Streaming Settings')

    const threadsInputAfter = page.locator('streaming-settings-page').locator('input[name="threads"]')
    const presetSelectAfter = page
      .locator('streaming-settings-page')
      .locator('shade-select')
      .filter({ has: page.locator('input[name="preset"]') })
    const presetHiddenInputAfter = presetSelectAfter.locator('input[type="hidden"]')

    await expect(threadsInputAfter).toHaveValue('12')
    await expect(presetHiddenInputAfter).toHaveValue('veryfast')

    // ============================================
    // STEP 7: Cleanup - restore original values
    // ============================================
    await threadsInputAfter.fill(initialThreads)

    // Restore the preset selection
    const presetLabel = PRESET_LABELS[initialPreset] ?? initialPreset
    await presetSelectAfter.locator('[role="combobox"]').click()
    await presetSelectAfter.locator('[role="option"]', { hasText: presetLabel }).click()

    const extractSubtitlesSwitchAfter = page
      .locator('streaming-settings-page')
      .locator('shade-switch')
      .filter({ has: page.locator('input[name="autoExtractSubtitles"]') })
    const extractSubtitlesCheckboxAfter = extractSubtitlesSwitchAfter.locator('input[type="checkbox"]')
    if (initialExtractSubtitles !== (await extractSubtitlesCheckboxAfter.isChecked())) {
      await extractSubtitlesSwitchAfter.click()
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
    await expect(page.locator('text=OMDB Settings').first()).toBeVisible()

    // ============================================
    // STEP 2: Navigate to Streaming settings
    // ============================================
    await page.getByText('Streaming Settings').click()
    await expect(page).toHaveURL(/\/app-settings\/streaming/)
    await expect(page.locator('text=Streaming Settings').first()).toBeVisible()

    // ============================================
    // STEP 3: Navigate to IOT settings and configure
    // ============================================
    await page.getByText('Device Availability').click()
    await expect(page).toHaveURL(/\/app-settings\/iot/)
    await expect(page.locator('text=IOT Device Availability').first()).toBeVisible()

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
    await expect(page.locator('text=Ollama Integration').first()).toBeVisible()

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
    await expect(page.locator('text=OMDB Settings').first()).toBeVisible()

    // ============================================
    // STEP 6: Cleanup - restore IOT and AI settings
    // ============================================
    // Restore IOT settings
    await page.getByText('Device Availability').click()
    await page.waitForSelector('text=IOT Device Availability')

    const pingIntervalInputCleanup = page.locator('iot-settings-page').locator('input[name="pingIntervalMs"]')
    const pingTimeoutInputCleanup = page.locator('iot-settings-page').locator('input[name="pingTimeoutMs"]')
    const iotSaveButtonCleanup = page.locator('iot-settings-page').getByRole('button', { name: /save settings/i })

    await pingIntervalInputCleanup.fill(initialPingInterval)
    await pingTimeoutInputCleanup.fill(initialPingTimeout)
    await iotSaveButtonCleanup.click()
    await assertAndDismissNoty(page, 'IOT settings saved successfully')

    // Restore AI settings
    await page.getByText('Ollama Settings').click()
    await page.waitForSelector('text=Ollama Integration')

    const hostInputCleanup = page.locator('ai-settings-page').locator('input[name="host"]')
    const aiSaveButtonCleanup = page.locator('ai-settings-page').getByRole('button', { name: /save settings/i })

    await hostInputCleanup.fill(initialHost)
    await aiSaveButtonCleanup.click()
    await assertAndDismissNoty(page, 'AI settings saved successfully')
  })
})
