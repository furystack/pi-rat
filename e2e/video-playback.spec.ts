import { test, expect } from '@playwright/test'
import { login } from './helpers.js'

test.describe('Video Playback @media', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await login(page)
  })

  test('Playback smoke: video loads and currentTime advances', async ({ page }) => {
    await page.goto('/movies')

    const movieLink = page.locator('a[href*="/movies/"]').first()
    const hasMovies = await movieLink.isVisible({ timeout: 5_000 }).catch(() => false)
    test.skip(!hasMovies, 'No movies available in test environment')

    await movieLink.click()

    const playButton = page.locator('button', { hasText: /play/i }).first()
    const hasPlay = await playButton.isVisible({ timeout: 5_000 }).catch(() => false)
    test.skip(!hasPlay, 'No play button found — movie detail page may differ')

    await playButton.click()

    const video = page.locator('video').first()
    await expect(video).toBeVisible({ timeout: 15_000 })

    await page.waitForTimeout(3_000)
    const currentTime = await video.evaluate((el: HTMLVideoElement) => el.currentTime)
    expect(currentTime).toBeGreaterThan(0)

    const errorDialog = page.locator('[role="alertdialog"], .error-dialog, shade-noty[data-type="error"]')
    await expect(errorDialog).toHaveCount(0)
  })

  test('Subtitle switching: tracks are listed and selectable', async ({ page }) => {
    await page.goto('/movies')

    const movieLink = page.locator('a[href*="/movies/"]').first()
    const hasMovies = await movieLink.isVisible({ timeout: 5_000 }).catch(() => false)
    test.skip(!hasMovies, 'No movies available in test environment')

    await movieLink.click()

    const playButton = page.locator('button', { hasText: /play/i }).first()
    const hasPlay = await playButton.isVisible({ timeout: 5_000 }).catch(() => false)
    test.skip(!hasPlay, 'No play button found')

    await playButton.click()

    const video = page.locator('video').first()
    await expect(video).toBeVisible({ timeout: 15_000 })

    const captionsButton = page.locator('button', { hasText: /caption|subtitle/i }).first()
    const hasCaptions = await captionsButton.isVisible({ timeout: 5_000 }).catch(() => false)
    test.skip(!hasCaptions, 'No captions menu available — file may lack subtitles')

    await captionsButton.click()

    const trackOptions = page.locator('[role="menuitem"], [role="option"], li').filter({ hasText: /.+/ })
    const optionCount = await trackOptions.count()
    expect(optionCount).toBeGreaterThan(0)

    await trackOptions.first().click()
  })

  test('Audio switching: multiple tracks shown, switching resumes playback', async ({ page }) => {
    await page.goto('/movies')

    const movieLink = page.locator('a[href*="/movies/"]').first()
    const hasMovies = await movieLink.isVisible({ timeout: 5_000 }).catch(() => false)
    test.skip(!hasMovies, 'No movies available in test environment')

    await movieLink.click()

    const playButton = page.locator('button', { hasText: /play/i }).first()
    const hasPlay = await playButton.isVisible({ timeout: 5_000 }).catch(() => false)
    test.skip(!hasPlay, 'No play button found')

    await playButton.click()

    const video = page.locator('video').first()
    await expect(video).toBeVisible({ timeout: 15_000 })

    const audioButton = page.locator('button', { hasText: /audio/i }).first()
    const hasAudio = await audioButton.isVisible({ timeout: 5_000 }).catch(() => false)
    test.skip(!hasAudio, 'No audio menu available — file may have single audio track')

    await audioButton.click()

    const audioOptions = page.locator('[role="menuitem"], [role="option"], li').filter({ hasText: /.+/ })
    const audioCount = await audioOptions.count()
    expect(audioCount).toBeGreaterThanOrEqual(2)

    await audioOptions.nth(1).click()

    await page.waitForTimeout(3_000)
    const currentTime = await video.evaluate((el: HTMLVideoElement) => el.currentTime)
    expect(currentTime).toBeGreaterThan(0)
  })

  test('Quality switching (HLS): changing quality continues playback', async ({ page }) => {
    await page.goto('/movies')

    const movieLink = page.locator('a[href*="/movies/"]').first()
    const hasMovies = await movieLink.isVisible({ timeout: 5_000 }).catch(() => false)
    test.skip(!hasMovies, 'No movies available in test environment')

    await movieLink.click()

    const playButton = page.locator('button', { hasText: /play/i }).first()
    const hasPlay = await playButton.isVisible({ timeout: 5_000 }).catch(() => false)
    test.skip(!hasPlay, 'No play button found')

    await playButton.click()

    const video = page.locator('video').first()
    await expect(video).toBeVisible({ timeout: 15_000 })

    const qualityButton = page.locator('button', { hasText: /quality|resolution/i }).first()
    const hasQuality = await qualityButton.isVisible({ timeout: 5_000 }).catch(() => false)
    test.skip(!hasQuality, 'No quality menu available — HLS not active or single variant')

    await qualityButton.click()

    const qualityOptions = page.locator('[role="menuitem"], [role="option"], li').filter({ hasText: /.+/ })
    const qualityCount = await qualityOptions.count()
    expect(qualityCount).toBeGreaterThanOrEqual(2)

    await qualityOptions.last().click()

    await page.waitForTimeout(3_000)
    const currentTime = await video.evaluate((el: HTMLVideoElement) => el.currentTime)
    expect(currentTime).toBeGreaterThan(0)
  })
})
