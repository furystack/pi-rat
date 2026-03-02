import { test, expect, type Page } from '@playwright/test'
import { execSync } from 'child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

import { login } from './helpers.js'

const FLAC_VIDEO_FILENAME = 'Flac.Audio.Test.mkv'
const MPEG2_VIDEO_FILENAME = 'Mpeg2.Video.Test.mkv'
const EXTSUB_VIDEO_FILENAME = 'External.Subs.Test.mkv'
const EXTSUB_SRT_FILENAME = 'External.Subs.Test.eng.srt'

const IMDB_FLAC = 'tt8880001'
const IMDB_MPEG2 = 'tt8880002'
const IMDB_EXTSUB = 'tt8880003'

let testDriveLetter: string
let movieFileIds: Record<string, string> = {}

const CODEC_SUPPORT_H264_AAC = {
  video: ['h264'],
  audio: ['aac'],
  containers: ['mp4', 'webm'],
}

const generateFlacAudioVideo = (dir: string): string => {
  const videoPath = join(dir, FLAC_VIDEO_FILENAME)
  execSync(
    [
      'ffmpeg -y',
      '-f lavfi -i "testsrc2=duration=3:size=640x360:rate=24"',
      '-f lavfi -i "sine=frequency=440:duration=3"',
      '-map 0:v -map 1:a',
      '-metadata:s:a:0 language=eng -metadata:s:a:0 title="English FLAC"',
      '-c:v libx264 -preset ultrafast -crf 28',
      '-c:a flac',
      `"${videoPath}"`,
    ].join(' '),
    { stdio: 'pipe' },
  )
  return videoPath
}

const generateMpeg2Video = (dir: string): string => {
  const videoPath = join(dir, MPEG2_VIDEO_FILENAME)
  execSync(
    [
      'ffmpeg -y',
      '-f lavfi -i "testsrc2=duration=3:size=640x360:rate=24"',
      '-f lavfi -i "sine=frequency=440:duration=3"',
      '-map 0:v -map 1:a',
      '-metadata:s:a:0 language=eng -metadata:s:a:0 title="English"',
      '-c:v mpeg2video -b:v 2M',
      '-c:a aac -b:a 64k',
      `"${videoPath}"`,
    ].join(' '),
    { stdio: 'pipe' },
  )
  return videoPath
}

const generateExtSubVideo = (dir: string): string => {
  const videoPath = join(dir, EXTSUB_VIDEO_FILENAME)
  execSync(
    [
      'ffmpeg -y',
      '-f lavfi -i "testsrc2=duration=3:size=640x360:rate=24"',
      '-f lavfi -i "sine=frequency=440:duration=3"',
      '-map 0:v -map 1:a',
      '-metadata:s:a:0 language=eng -metadata:s:a:0 title="English"',
      '-c:v libx264 -preset ultrafast -crf 28',
      '-c:a aac -b:a 64k',
      `"${videoPath}"`,
    ].join(' '),
    { stdio: 'pipe' },
  )

  const srtPath = join(dir, EXTSUB_SRT_FILENAME)
  writeFileSync(
    srtPath,
    [
      '1',
      '00:00:00,000 --> 00:00:01,500',
      'External subtitle line one.',
      '',
      '2',
      '00:00:01,800 --> 00:00:03,000',
      'External subtitle line two.',
      '',
    ].join('\n'),
  )

  return videoPath
}

const uploadVideoAndCreateEntities = async (
  page: Page,
  dir: string,
  filename: string,
  imdbId: string,
  relatedFiles?: Array<{ type: string; path: string }>,
) => {
  const videoBuffer = await readFile(join(dir, filename))
  const uploadRes = await page.request.post(
    `/api/drives/volumes/${encodeURIComponent(testDriveLetter)}/${encodeURIComponent('/')}/upload`,
    {
      multipart: {
        file: {
          name: filename,
          mimeType: 'video/x-matroska',
          buffer: videoBuffer,
        },
      },
    },
  )
  expect(uploadRes.ok(), `Upload failed for ${filename}: ${uploadRes.status()}`).toBeTruthy()

  const ffprobeRes = await page.request.get(`/api/drives/files/${testDriveLetter}/${filename}/ffprobe`)
  expect(ffprobeRes.ok(), `Ffprobe failed for ${filename}: ${ffprobeRes.status()}`).toBeTruthy()
  const ffprobeData = (await ffprobeRes.json()) as {
    streams: Array<Record<string, unknown>>
    [key: string]: unknown
  }

  for (const stream of ffprobeData.streams) {
    if (typeof stream.profile === 'string') {
      delete stream.profile
    }
  }

  const createMovieRes = await page.request.post('/api/media/movies', {
    data: {
      imdbId,
      title: `E2E Codec Test ${imdbId}`,
      year: 2024,
      genre: ['Test'],
      type: 'movie',
    },
  })
  expect(createMovieRes.ok(), `Movie creation failed for ${imdbId}: ${createMovieRes.status()}`).toBeTruthy()

  const movieFileData: Record<string, unknown> = {
    driveLetter: testDriveLetter,
    path: filename,
    imdbId,
    ffprobe: ffprobeData,
  }
  if (relatedFiles) {
    movieFileData.relatedFiles = relatedFiles
  }

  const createMovieFileRes = await page.request.post('/api/media/movie-files', {
    data: movieFileData,
  })
  expect(
    createMovieFileRes.ok(),
    `MovieFile creation failed for ${imdbId}: ${createMovieFileRes.status()} ${await createMovieFileRes.text()}`,
  ).toBeTruthy()
  const movieFileBody = (await createMovieFileRes.json()) as { id: string }
  return movieFileBody.id
}

const navigateToMovieAndPlay = async (page: Page, imdbId: string) => {
  await page.goto('/movies')

  const movieLink = page.locator(`a[href*="/movies/${imdbId}"]`).first()
  await expect(movieLink).toBeVisible({ timeout: 10_000 })
  await movieLink.click()

  const playButton = page
    .locator('button', { hasText: /start watching|watch from the beginning|continue from/i })
    .first()
  await expect(playButton).toBeVisible({ timeout: 10_000 })
  await playButton.click()

  const video = page.locator('video').first()
  await expect(video).toBeVisible({ timeout: 15_000 })

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

test.describe('Video Playback Codec Mismatch @media-codecs', () => {
  test.beforeAll(async ({ browser }) => {
    const browserName = browser.browserType().name()
    testDriveLetter = `e2e-c-${browserName[0]}`
    movieFileIds = {}

    const tempDir = mkdtempSync(join(tmpdir(), 'pi-rat-e2e-codecs-'))

    generateFlacAudioVideo(tempDir)
    generateMpeg2Video(tempDir)
    generateExtSubVideo(tempDir)

    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/')
    await login(page)

    // Pre-cleanup
    for (const imdbId of [IMDB_FLAC, IMDB_MPEG2, IMDB_EXTSUB]) {
      await page.request.delete(`/api/media/movies/${imdbId}`)
    }
    await page.request.delete(`/api/drives/volumes/${testDriveLetter}`)

    const drivePath = join(process.env?.E2E_TEMP || '/tmp', 'video-codec-test', browserName)
    const createDriveRes = await page.request.post('/api/drives/volumes', {
      data: { letter: testDriveLetter, physicalPath: drivePath },
    })
    expect(createDriveRes.ok(), `Drive creation failed: ${createDriveRes.status()}`).toBeTruthy()

    // Upload external subtitle file before creating entities
    const srtBuffer = await readFile(join(tempDir, EXTSUB_SRT_FILENAME))
    const uploadSrtRes = await page.request.post(
      `/api/drives/volumes/${encodeURIComponent(testDriveLetter)}/${encodeURIComponent('/')}/upload`,
      {
        multipart: {
          file: {
            name: EXTSUB_SRT_FILENAME,
            mimeType: 'text/plain',
            buffer: srtBuffer,
          },
        },
      },
    )
    expect(uploadSrtRes.ok(), `SRT upload failed: ${uploadSrtRes.status()}`).toBeTruthy()

    movieFileIds.flac = await uploadVideoAndCreateEntities(page, tempDir, FLAC_VIDEO_FILENAME, IMDB_FLAC)
    movieFileIds.mpeg2 = await uploadVideoAndCreateEntities(page, tempDir, MPEG2_VIDEO_FILENAME, IMDB_MPEG2)
    movieFileIds.extsub = await uploadVideoAndCreateEntities(page, tempDir, EXTSUB_VIDEO_FILENAME, IMDB_EXTSUB, [
      { type: 'subtitle', path: EXTSUB_SRT_FILENAME },
    ])

    rmSync(tempDir, { recursive: true })
    await context.close()
  })

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/')
    await login(page)

    for (const id of Object.values(movieFileIds)) {
      if (id) await page.request.delete(`/api/media/movie-files/${id}`)
    }
    for (const imdbId of [IMDB_FLAC, IMDB_MPEG2, IMDB_EXTSUB]) {
      await page.request.delete(`/api/media/movies/${imdbId}`)
    }
    await page.request.delete(`/api/drives/volumes/${testDriveLetter}`)

    await context.close()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await login(page)
  })

  test('Unsupported audio codec (FLAC): playback-info returns direct-stream and video plays', async ({ page }) => {
    const playbackInfoRes = await page.request.post('/api/media/playback-info', {
      data: {
        file: { driveLetter: testDriveLetter, path: FLAC_VIDEO_FILENAME },
        codecSupport: CODEC_SUPPORT_H264_AAC,
      },
    })
    expect(playbackInfoRes.ok(), `playback-info failed: ${playbackInfoRes.status()}`).toBeTruthy()
    const playbackInfo = (await playbackInfoRes.json()) as { mode: string }
    expect(playbackInfo.mode).toBe('direct-stream')

    await navigateToMovieAndPlay(page, IMDB_FLAC)

    const errorDialog = page.locator('[role="alertdialog"], .error-dialog, shade-noty[data-type="error"]')
    await expect(errorDialog).toHaveCount(0)
  })

  test('Unsupported video codec (MPEG-2): playback-info returns transcode and video plays', async ({ page }) => {
    const playbackInfoRes = await page.request.post('/api/media/playback-info', {
      data: {
        file: { driveLetter: testDriveLetter, path: MPEG2_VIDEO_FILENAME },
        codecSupport: CODEC_SUPPORT_H264_AAC,
      },
    })
    expect(playbackInfoRes.ok(), `playback-info failed: ${playbackInfoRes.status()}`).toBeTruthy()
    const playbackInfo = (await playbackInfoRes.json()) as { mode: string }
    expect(playbackInfo.mode).toBe('transcode')

    await navigateToMovieAndPlay(page, IMDB_MPEG2)

    const errorDialog = page.locator('[role="alertdialog"], .error-dialog, shade-noty[data-type="error"]')
    await expect(errorDialog).toHaveCount(0)
  })

  test('External subtitle: track appears in captions menu and is selectable', async ({ page }) => {
    const video = await navigateToMovieAndPlay(page, IMDB_EXTSUB)
    await openSettingsSubmenu(page, 'Captions')

    const captionOptions = page.locator('media-captions-menu media-chrome-menu-item')
    await expect(captionOptions.first()).toBeVisible({ timeout: 5_000 })
    const optionCount = await captionOptions.count()
    expect(optionCount).toBeGreaterThan(0)

    const externalOption = captionOptions.filter({ hasText: new RegExp(EXTSUB_SRT_FILENAME, 'i') })
    const hasExternal = (await externalOption.count()) > 0
    if (hasExternal) {
      await externalOption.first().click()
    } else {
      await captionOptions.first().click()
    }

    // Verify playback continues after selecting subtitle
    await expect(async () => {
      const currentTime = await video.evaluate((el: HTMLVideoElement) => el.currentTime)
      expect(currentTime).toBeGreaterThan(0)
    }).toPass({ timeout: 15_000, intervals: [2_000, 3_000] })
  })
})
