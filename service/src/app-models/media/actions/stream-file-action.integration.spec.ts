import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { FfprobeData, MoviesConfig, StreamQueryParams } from 'common'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { execSync } from 'child_process'
import { mkdirSync, existsSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { FfprobeService } from '../../../ffprobe-service.js'
import { HwAccelDetector } from '../services/hw-accel-detector.js'
import { StreamFileActionCaches } from '../services/stream-file-action-caches.js'
import { generateMasterPlaylist, generateMediaPlaylist } from '../services/hls-manifest-generator.js'
import { buildAudioTrackList, buildSubtitleTrackList, resolvePlaybackMode } from '../services/stream-builder.js'

vi.mock('@furystack/core', () => ({
  useSystemIdentityContext: ({ injector }: { injector: unknown }) => injector,
}))

vi.mock('@furystack/repository', () => ({
  getDataSetFor: () => ({
    get: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockReturnValue({ [Symbol.dispose]: vi.fn() }),
  }),
}))

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      verbose: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      information: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

const FIXTURE_DIR = join(tmpdir(), 'pirat-test-fixtures')
const FIXTURE_FILE = join(FIXTURE_DIR, 'test-fixture.mkv')

const hasFfmpeg = (): boolean => {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const generateTestFixture = () => {
  if (existsSync(FIXTURE_FILE)) return

  mkdirSync(FIXTURE_DIR, { recursive: true })

  execSync(
    [
      'ffmpeg',
      '-f lavfi -i testsrc=duration=5:size=320x240:rate=25',
      '-f lavfi -i sine=frequency=440:duration=5',
      '-f lavfi -i sine=frequency=880:duration=5',
      '-map 0:v -map 1:a -map 2:a',
      '-c:v libx264 -c:a:0 aac -c:a:1 ac3',
      '-metadata:s:a:0 language=eng -metadata:s:a:1 language=fra',
      '-y',
      FIXTURE_FILE,
    ].join(' '),
    { stdio: 'ignore', timeout: 30_000 },
  )
}

const ffmpegAvailable = hasFfmpeg()

const describeIfFfmpeg = ffmpegAvailable ? describe : describe.skip

describeIfFfmpeg('Integration: Stream file actions with real FFmpeg', () => {
  let realFfprobe: FfprobeData

  beforeAll(() => {
    generateTestFixture()
    const stdout = execSync(
      `ffprobe -v error -print_format json -show_format -show_streams -show_chapters "${FIXTURE_FILE}"`,
      { encoding: 'utf-8' },
    )
    realFfprobe = JSON.parse(stdout) as FfprobeData
  })

  afterAll(() => {
    if (existsSync(FIXTURE_DIR)) {
      rmSync(FIXTURE_DIR, { recursive: true, force: true })
    }
  })

  describe('FFmpeg args builder with real probe data', () => {
    const buildArgs = async (queryParams: StreamQueryParams) => {
      return await usingAsync(new Injector(), async (injector) => {
        injector.setExplicitInstance(
          { getFfprobeForPiratFile: vi.fn().mockResolvedValue(realFfprobe) } as unknown as FfprobeService,
          FfprobeService,
        )
        injector.setExplicitInstance(
          {
            getEncoder: vi.fn().mockResolvedValue('libx264'),
            detect: vi.fn().mockResolvedValue({ available: [], encoders: {} }),
          } as unknown as HwAccelDetector,
          HwAccelDetector,
        )

        const caches = injector.getInstance(StreamFileActionCaches)
        caches.driveCache = {
          get: vi.fn().mockResolvedValue({ letter: 'T', physicalPath: FIXTURE_DIR }),
        } as never
        caches.moviesConfigCache = {
          get: vi.fn().mockResolvedValue({
            id: 'MOVIES_CONFIG',
            value: { preset: 'ultrafast', watchFiles: 'all' },
          } satisfies MoviesConfig),
        } as never

        return await caches.ffMpegArgsCache.get({
          injector,
          file: { driveLetter: 'T', path: 'test-fixture.mkv' },
          queryParams,
        })
      })
    }

    it('should produce -c:v copy and -c:a copy for remux mode', async () => {
      const args = await buildArgs({ mode: 'remux', from: 0, to: 5, audio: { trackId: 0 } })

      expect(args[args.indexOf('-c:v') + 1]).toBe('copy')
      expect(args[args.indexOf('-c:a') + 1]).toBe('copy')
      expect(args).toContain(join(FIXTURE_DIR, 'test-fixture.mkv'))
    })

    it('should produce -c:v copy and -c:a aac for direct-stream mode', async () => {
      const args = await buildArgs({
        mode: 'direct-stream',
        from: 0,
        to: 5,
        audio: { trackId: 0, audioCodec: 'aac' },
      })

      expect(args[args.indexOf('-c:v') + 1]).toBe('copy')
      expect(args[args.indexOf('-c:a') + 1]).toBe('aac')
    })

    it('should produce -c:v libx264 for transcode mode', async () => {
      const args = await buildArgs({ mode: 'transcode', from: 0, to: 5, audio: { trackId: 0 } })

      expect(args[args.indexOf('-c:v') + 1]).toBe('libx264')
      expect(args).toContain('-preset')
    })

    it('should produce valid FFmpeg output when spawned with remux args', async () => {
      const args = await buildArgs({ mode: 'remux', from: 0, to: 3, audio: { trackId: 0 } })

      const { execSync: execSyncLocal } = await import('child_process')
      const output = execSyncLocal(`ffmpeg ${args.join(' ')}`, {
        timeout: 15_000,
        maxBuffer: 50 * 1024 * 1024,
      })

      expect(output.length).toBeGreaterThan(0)
      const header = output.subarray(0, 12)
      const hasISOBMFF = header.toString('ascii', 4, 8) === 'ftyp' || header.toString('ascii', 4, 8) === 'moof'
      const hasMoov = output.includes(Buffer.from('moov')) || output.includes(Buffer.from('moof'))
      expect(hasISOBMFF || hasMoov).toBe(true)
    })

    it('should produce valid FFmpeg output when spawned with transcode args', async () => {
      const args = await buildArgs({
        mode: 'transcode',
        from: 0,
        to: 3,
        audio: { trackId: 0 },
        video: { codec: 'libx264' },
      })

      const { execSync: execSyncLocal } = await import('child_process')
      const output = execSyncLocal(`ffmpeg ${args.join(' ')}`, {
        timeout: 30_000,
        maxBuffer: 50 * 1024 * 1024,
      })

      expect(output.length).toBeGreaterThan(0)
    })
  })

  describe('Stream builder with real probe data', () => {
    it('should resolve remux when codecs match but container is MKV', () => {
      const result = resolvePlaybackMode({
        ffprobe: realFfprobe,
        codecSupport: { video: ['h264'], audio: ['aac'], containers: ['mp4'] },
      })
      expect(result.mode).toBe('remux')
    })

    it('should resolve direct-stream when audio codec is unsupported', () => {
      const result = resolvePlaybackMode({
        ffprobe: realFfprobe,
        codecSupport: { video: ['h264'], audio: ['opus'], containers: ['mp4', 'matroska'] },
        selectedAudioTrackIndex: realFfprobe.streams.find((s) => s.codec_name === 'ac3')?.index,
      })
      expect(result.mode).toBe('direct-stream')
    })

    it('should build audio track list with both tracks', () => {
      const tracks = buildAudioTrackList(realFfprobe)
      expect(tracks.length).toBeGreaterThanOrEqual(2)
      expect(tracks.some((t) => t.language === 'eng')).toBe(true)
      expect(tracks.some((t) => t.language === 'fra')).toBe(true)
    })
  })

  describe('HLS manifest generation with real probe data', () => {
    it('should generate a parseable master playlist', () => {
      const file = { driveLetter: 'T', path: 'test-fixture.mkv' }
      const audioTracks = buildAudioTrackList(realFfprobe)
      const subtitleTracks = buildSubtitleTrackList(realFfprobe, file)

      const playlist = generateMasterPlaylist({
        ffprobe: realFfprobe,
        file,
        mode: 'remux',
        baseUrl: '/api/media',
        audioTracks,
        subtitleTracks,
      })

      expect(playlist).toContain('#EXTM3U')
      expect(playlist).toContain('#EXT-X-VERSION:7')
      expect(playlist).toContain('#EXT-X-STREAM-INF:')
      expect(playlist).toContain('stream.m3u8')

      if (audioTracks.length > 1) {
        expect(playlist).toContain('TYPE=AUDIO')
      }
    })

    it('should generate a valid media playlist with correct segment count', () => {
      const duration = realFfprobe.format.duration || 5
      const playlist = generateMediaPlaylist({
        duration,
        segmentDuration: 2,
        baseUrl: '/api/media/files/T/test-fixture.mkv',
        mode: 'remux',
      })

      expect(playlist).toContain('#EXTM3U')
      expect(playlist).toContain('#EXT-X-PLAYLIST-TYPE:VOD')
      expect(playlist).toContain('#EXT-X-ENDLIST')

      const segmentCount = (playlist.match(/#EXTINF:/g) || []).length
      expect(segmentCount).toBe(Math.ceil(duration / 2))
    })
  })
})
