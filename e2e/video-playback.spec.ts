import { expect, test, type Page } from '@playwright/test'
import { execSync } from 'child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

import { login } from './helpers.js'

const getTestVideoFileName = (browserName: string, workerIndex: number) =>
  `Test.Movie.2024.${browserName}.w${workerIndex}.mkv`
const getTestMovieImdbId = (browserName: string, workerIndex: number) => `tt9999999-${browserName}-w${workerIndex}`

let testDriveLetter: string
let testDrivePath: string
let movieFileId: string
let workerIndex: number

/**
 * Generates a small MKV test video with:
 * - 720p H.264 video (5 seconds, testsrc2 pattern)
 * - Two AAC audio tracks (English 440 Hz, Spanish 880 Hz)
 * - One embedded SRT subtitle track (English)
 *
 * @returns The path to the temporary directory containing the video
 */
const generateTestVideo = (browserName: string, wIndex: number): string => {
  const dir = mkdtempSync(join(tmpdir(), 'pi-rat-e2e-'))
  const srtPath = join(dir, 'subs.srt')
  const videoPath = join(dir, getTestVideoFileName(browserName, wIndex))

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

const navigateToMovieAndPlay = async (page: Page, browserName: string, wIndex: number) => {
  await page.goto('/movies')

  const movieLink = page.locator(`a[href*="/movies/${getTestMovieImdbId(browserName, wIndex)}"]`).first()
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
  const settingsButton = page.locator('[data-testid="settings-menu-button"]').first()
  await expect(settingsButton).toBeVisible({ timeout: 5_000 })
  await settingsButton.click()

  const menuItem = page.locator('[data-testid="settings-menu-item"]').filter({ hasText: menuItemText })
  await expect(menuItem).toBeVisible({ timeout: 5_000 })
  await menuItem.click()
}

test.describe('Video Playback @media', () => {
  test.beforeAll(async ({ browser }) => {
    const browserName = browser.browserType().name()
    ;({ workerIndex } = test.info())
    testDriveLetter = `e2e-v-${browserName[0]}${workerIndex}`

    const tempDir = generateTestVideo(browserName, workerIndex)

    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/')
    await login(page)

    // Pre-cleanup: remove leftover data from previous failed runs
    await page.request.delete(`/api/media/movies/${getTestMovieImdbId(browserName, workerIndex)}`)
    await page.request.delete(`/api/drives/volumes/${testDriveLetter}`)

    // Create a drive for the test video
    testDrivePath = join(
      process.env?.E2E_TEMP || process.cwd(),
      'browser-temp',
      'video-playback-tests',
      `${browserName}-w${workerIndex}`,
    )
    const createDriveRes = await page.request.post('/api/drives/volumes', {
      data: { letter: testDriveLetter, physicalPath: testDrivePath },
    })
    expect(createDriveRes.ok(), `Drive creation failed: ${createDriveRes.status()}`).toBeTruthy()

    // Upload the generated video to the drive
    const videoBuffer = await readFile(join(tempDir, getTestVideoFileName(browserName, workerIndex)))
    const uploadRes = await page.request.post(
      `/api/drives/volumes/${encodeURIComponent(testDriveLetter)}/${encodeURIComponent('/')}/upload`,
      {
        multipart: {
          file: {
            name: getTestVideoFileName(browserName, workerIndex),
            mimeType: 'video/x-matroska',
            buffer: videoBuffer,
          },
        },
      },
    )
    expect(uploadRes.ok(), `Video upload failed: ${uploadRes.status()}`).toBeTruthy()

    // Retrieve ffprobe data from the server
    const ffprobeRes = await page.request.get(
      `/api/drives/files/${testDriveLetter}/${getTestVideoFileName(browserName, workerIndex)}/ffprobe`,
    )
    expect(ffprobeRes.ok(), `Ffprobe failed: ${ffprobeRes.status()}`).toBeTruthy()
    const ffprobeData = await ffprobeRes.json()

    // Create Movie entity (bypasses OMDB dependency)
    const createMovieRes = await page.request.post('/api/media/movies', {
      data: {
        imdbId: getTestMovieImdbId(browserName, workerIndex),
        title: `E2E Test Movie w${workerIndex}`,
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
        path: getTestVideoFileName(browserName, workerIndex),
        imdbId: getTestMovieImdbId(browserName, workerIndex),
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

  test.afterAll(async ({ browser, browserName }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/')
    await login(page)

    if (movieFileId) {
      await page.request.delete(`/api/media/movie-files/${movieFileId}`)
    }
    await page.request.delete(`/api/media/movies/${getTestMovieImdbId(browserName, workerIndex)}`)
    await page.request.delete(`/api/drives/volumes/${testDriveLetter}`)

    if (testDrivePath) {
      rmSync(testDrivePath, { recursive: true, force: true })
    }

    await context.close()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await login(page)
  })

  test('Playback smoke: video loads and currentTime advances', async ({ page, browserName }) => {
    await navigateToMovieAndPlay(page, browserName, workerIndex)

    const errorDialog = page.locator('[role="alertdialog"], .error-dialog, shade-noty[data-type="error"]')
    await expect(errorDialog).toHaveCount(0)
  })

  test('Subtitle switching: tracks are listed and selectable', async ({ page, browserName }) => {
    await navigateToMovieAndPlay(page, browserName, workerIndex)
    await openSettingsSubmenu(page, 'Captions')

    const captionOptions = page.locator('[data-testid="caption-track-item"]')
    await expect(captionOptions.first()).toBeVisible({ timeout: 5_000 })
    const optionCount = await captionOptions.count()
    expect(optionCount).toBeGreaterThan(0)

    await captionOptions.first().click()
  })

  test('Audio switching: multiple tracks shown, switching resumes playback', async ({ page, browserName }) => {
    const video = await navigateToMovieAndPlay(page, browserName, workerIndex)
    await openSettingsSubmenu(page, 'Audio')

    const audioOptions = page.locator('[data-testid="audio-track-item"]')
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

  // Quality/resolution switching was removed in favour of server-side mode
  // selection (transcode / remux / direct-play). No client-side resolution
  // observable exists anymore, so the former E2E test is intentionally omitted.
})
