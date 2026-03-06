import { test, expect, type Page } from '@playwright/test'
import { execSync } from 'child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

import { login } from './helpers.js'

const TEST_VIDEO_FILENAME = 'Test.Movie.2024.mkv'
const TEST_MOVIE_IMDB_ID = 'tt9999999'

let testDriveLetter: string
let movieFileId: string

/**
 * Generates a small MKV test video with:
 * - 720p H.264 video (5 seconds, testsrc2 pattern)
 * - Two AAC audio tracks (English 440 Hz, Spanish 880 Hz)
 * - One embedded SRT subtitle track (English)
 *
 * @returns The path to the temporary directory containing the video
 */
const generateTestVideo = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'pi-rat-e2e-'))
  const srtPath = join(dir, 'subs.srt')
  const videoPath = join(dir, TEST_VIDEO_FILENAME)

  writeFileSync(
    srtPath,
    [
      '1',
      '00:00:00,000 --> 00:00:02,000',
      'Hello, this is a test subtitle.',
      '',
      '2',
      '00:00:02,500 --> 00:00:05,000',
      'This is the second subtitle line.',
      '',
    ].join('\n'),
  )

  execSync(
    [
      'ffmpeg -y',
      '-f lavfi -i "testsrc2=duration=5:size=1280x720:rate=24"',
      '-f lavfi -i "sine=frequency=440:duration=5"',
      '-f lavfi -i "sine=frequency=880:duration=5"',
      `-f srt -i "${srtPath}"`,
      '-map 0:v -map 1:a -map 2:a -map 3:s',
      '-metadata:s:a:0 language=eng -metadata:s:a:0 title="English"',
      '-metadata:s:a:1 language=spa -metadata:s:a:1 title="Spanish"',
      '-metadata:s:s:0 language=eng -metadata:s:s:0 title="English"',
      '-c:v libx264 -preset ultrafast -crf 28',
      '-c:a aac -b:a 64k',
      '-c:s srt',
      `"${videoPath}"`,
    ].join(' '),
    { stdio: 'pipe' },
  )

  return dir
}

const navigateToMovieAndPlay = async (page: Page) => {
  await page.goto('/movies')

  const movieLink = page.locator(`a[href*="/movies/${TEST_MOVIE_IMDB_ID}"]`).first()
  await expect(movieLink).toBeVisible({ timeout: 10_000 })
  await movieLink.click()

  const playButton = page
    .locator('button', { hasText: /start watching|watch from the beginning|continue from/i })
    .first()
  await expect(playButton).toBeVisible({ timeout: 10_000 })
  await playButton.click()

  const video = page.locator('video').first()
  await expect(video).toBeVisible({ timeout: 15_000 })

  // Wait for video to actually start playing (HLS transcoding takes time)
  await expect(async () => {
    const currentTime = await video.evaluate((el: HTMLVideoElement) => el.currentTime)
    expect(currentTime).toBeGreaterThan(0)
  }).toPass({ timeout: 30_000, intervals: [2_000, 3_000, 5_000] })

  return video
}

const openSettingsSubmenu = async (page: Page, menuItemText: string) => {
  const settingsButton = page.locator('media-settings-menu-button').first()
  await expect(settingsButton).toBeVisible({ timeout: 5_000 })
  await settingsButton.click()

  const menuItem = page.locator('media-settings-menu-item').filter({ hasText: menuItemText })
  await expect(menuItem).toBeVisible({ timeout: 5_000 })
  await menuItem.click()
}

test.describe('Video Playback @media', () => {
  test.beforeAll(async ({ browser }) => {
    const browserName = browser.browserType().name()
    testDriveLetter = `e2e-v-${browserName[0]}`

    const tempDir = generateTestVideo()

    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/')
    await login(page)

    // Pre-cleanup: remove leftover data from previous failed runs
    await page.request.delete(`/api/media/movies/${TEST_MOVIE_IMDB_ID}`)
    await page.request.delete(`/api/drives/volumes/${testDriveLetter}`)

    // Create a drive for the test video
    const drivePath = join(process.env?.E2E_TEMP || '/tmp', 'video-test', browserName)
    const createDriveRes = await page.request.post('/api/drives/volumes', {
      data: { letter: testDriveLetter, physicalPath: drivePath },
    })
    expect(createDriveRes.ok(), `Drive creation failed: ${createDriveRes.status()}`).toBeTruthy()

    // Upload the generated video to the drive
    const videoBuffer = await readFile(join(tempDir, TEST_VIDEO_FILENAME))
    const uploadRes = await page.request.post(
      `/api/drives/volumes/${encodeURIComponent(testDriveLetter)}/${encodeURIComponent('/')}/upload`,
      {
        multipart: {
          file: {
            name: TEST_VIDEO_FILENAME,
            mimeType: 'video/x-matroska',
            buffer: videoBuffer,
          },
        },
      },
    )
    expect(uploadRes.ok(), `Video upload failed: ${uploadRes.status()}`).toBeTruthy()

    // Retrieve ffprobe data from the server
    const ffprobeRes = await page.request.get(`/api/drives/files/${testDriveLetter}/${TEST_VIDEO_FILENAME}/ffprobe`)
    expect(ffprobeRes.ok(), `Ffprobe failed: ${ffprobeRes.status()}`).toBeTruthy()
    const ffprobeData = await ffprobeRes.json()

    // Create Movie entity (bypasses OMDB dependency)
    const createMovieRes = await page.request.post('/api/media/movies', {
      data: {
        imdbId: TEST_MOVIE_IMDB_ID,
        title: 'E2E Test Movie',
        year: 2024,
        genre: ['Test'],
        type: 'movie',
      },
    })
    expect(createMovieRes.ok(), `Movie creation failed: ${createMovieRes.status()}`).toBeTruthy()

    // Create MovieFile entity linked to the movie with real ffprobe data
    const createMovieFileRes = await page.request.post('/api/media/movie-files', {
      data: {
        driveLetter: testDriveLetter,
        path: TEST_VIDEO_FILENAME,
        imdbId: TEST_MOVIE_IMDB_ID,
        ffprobe: ffprobeData,
      },
    })
    expect(
      createMovieFileRes.ok(),
      `MovieFile creation failed: ${createMovieFileRes.status()} ${await createMovieFileRes.text()}`,
    ).toBeTruthy()
    const movieFileBody = (await createMovieFileRes.json()) as { id: string }
    movieFileId = movieFileBody.id

    rmSync(tempDir, { recursive: true })
    await context.close()
  })

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/')
    await login(page)

    if (movieFileId) {
      await page.request.delete(`/api/media/movie-files/${movieFileId}`)
    }
    await page.request.delete(`/api/media/movies/${TEST_MOVIE_IMDB_ID}`)
    await page.request.delete(`/api/drives/volumes/${testDriveLetter}`)

    await context.close()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await login(page)
  })

  test('Playback smoke: video loads and currentTime advances', async ({ page }) => {
    await navigateToMovieAndPlay(page)

    const errorDialog = page.locator('[role="alertdialog"], .error-dialog, shade-noty[data-type="error"]')
    await expect(errorDialog).toHaveCount(0)
  })

  test('Subtitle switching: tracks are listed and selectable', async ({ page }) => {
    await navigateToMovieAndPlay(page)
    await openSettingsSubmenu(page, 'Captions')

    const captionOptions = page.locator('media-captions-menu media-chrome-menu-item')
    await expect(captionOptions.first()).toBeVisible({ timeout: 5_000 })
    const optionCount = await captionOptions.count()
    expect(optionCount).toBeGreaterThan(0)

    await captionOptions.first().click()
  })

  test('Audio switching: multiple tracks shown, switching resumes playback', async ({ page }) => {
    const video = await navigateToMovieAndPlay(page)
    await openSettingsSubmenu(page, 'Audio')

    const audioOptions = page.locator('media-audio-track-menu media-chrome-menu-item')
    await expect(audioOptions.first()).toBeVisible({ timeout: 5_000 })
    const audioCount = await audioOptions.count()
    expect(audioCount).toBeGreaterThanOrEqual(2)

    await audioOptions.nth(1).click()

    // After switching audio tracks the player reloads — wait for playback to resume
    await expect(async () => {
      const currentTime = await video.evaluate((el: HTMLVideoElement) => el.currentTime)
      expect(currentTime).toBeGreaterThan(0)
    }).toPass({ timeout: 30_000, intervals: [2_000, 3_000, 5_000] })
  })

  test('Quality switching (HLS): quality options are listed and selectable', async ({ page }) => {
    const video = await navigateToMovieAndPlay(page)
    await openSettingsSubmenu(page, 'Quality')

    const qualityOptions = page.locator('media-rendition-menu media-chrome-menu-item')
    await expect(qualityOptions.first()).toBeVisible({ timeout: 5_000 })
    const qualityCount = await qualityOptions.count()
    expect(qualityCount).toBeGreaterThanOrEqual(2)

    await qualityOptions.last().click()

    // Verify playback continues after quality switch
    await expect(async () => {
      const currentTime = await video.evaluate((el: HTMLVideoElement) => el.currentTime)
      expect(currentTime).toBeGreaterThan(0)
    }).toPass({ timeout: 30_000, intervals: [2_000, 3_000, 5_000] })
  })
})
