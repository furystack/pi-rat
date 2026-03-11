import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { FfprobeData } from 'common'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { TranscodingSessionService } from './transcoding-session.js'
import { FfprobeService } from '../../../ffprobe-service.js'
import { HwAccelDetector } from './hw-accel-detector.js'

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      verbose: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

vi.mock('@furystack/core', () => ({
  useSystemIdentityContext: ({ injector }: { injector: unknown }) => injector,
}))

vi.mock('@furystack/repository', () => ({
  getDataSetFor: (_injector: unknown, model: unknown) => {
    const name = (model as { name?: string })?.name
    if (name === 'Drive') {
      return { get: vi.fn().mockResolvedValue({ letter: 'A', physicalPath: '/mnt/media' }) }
    }
    return { get: vi.fn().mockResolvedValue(undefined) }
  },
}))

const mockSpawn = vi.fn()

vi.mock('child_process', () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args) as unknown,
}))

const mockFfprobe: FfprobeData = {
  streams: [
    { index: 0, codec_type: 'video', codec_name: 'h264', width: 1920, height: 1080, tags: {} },
    { index: 1, codec_type: 'audio', codec_name: 'aac', channels: 2, tags: {}, disposition: { default: 1 } },
  ],
  format: { format_name: 'matroska', duration: '60' },
  chapters: [],
}

const createMockProcess = () => {
  const stderrHandlers: Record<string, Array<(...args: unknown[]) => void>> = {}
  const processHandlers: Record<string, Array<(...args: unknown[]) => void>> = {}

  return {
    killed: false,
    kill: vi.fn(),
    stderr: {
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        if (!stderrHandlers[event]) stderrHandlers[event] = []
        stderrHandlers[event].push(handler)
      }),
    },
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!processHandlers[event]) processHandlers[event] = []
      processHandlers[event].push(handler)
    }),
    _stderrHandlers: stderrHandlers,
    _processHandlers: processHandlers,
  }
}

describe('TranscodingSessionService', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockSpawn.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should return undefined for non-existent session', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const service = injector.getInstance(TranscodingSessionService)
      try {
        const session = service.getSession('A', 'test.mkv', 'transcode', 0)
        expect(session).toBeUndefined()
      } finally {
        service.dispose()
      }
    })
  })

  it('should create and retrieve a session', async () => {
    const mockProcess = createMockProcess()
    mockSpawn.mockReturnValue(mockProcess)

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
        FfprobeService,
      )
      injector.setExplicitInstance(
        { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
        HwAccelDetector,
      )

      const service = injector.getInstance(TranscodingSessionService)
      try {
        const session = await service.getOrCreateSession({
          driveLetter: 'A',
          path: 'test.mkv',
          mode: 'transcode',
          audioTrackId: 0,
        })

        expect(session).toBeDefined()
        expect(session.state).toBe('starting')
        expect(session.mode).toBe('transcode')
        expect(session.driveLetter).toBe('A')
        expect(session.path).toBe('test.mkv')

        const retrieved = service.getSession('A', 'test.mkv', 'transcode', 0)
        expect(retrieved).toBe(session)
      } finally {
        service.dispose()
      }
    })
  })

  it('should reuse existing session on duplicate getOrCreateSession call', async () => {
    const mockProcess = createMockProcess()
    mockSpawn.mockReturnValue(mockProcess)

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
        FfprobeService,
      )
      injector.setExplicitInstance(
        { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
        HwAccelDetector,
      )

      const service = injector.getInstance(TranscodingSessionService)
      try {
        const session1 = await service.getOrCreateSession({
          driveLetter: 'A',
          path: 'test.mkv',
          mode: 'transcode',
        })
        const session2 = await service.getOrCreateSession({
          driveLetter: 'A',
          path: 'test.mkv',
          mode: 'transcode',
        })

        expect(session1).toBe(session2)
        expect(mockSpawn).toHaveBeenCalledTimes(1)
      } finally {
        service.dispose()
      }
    })
  })

  it('should create separate sessions for different parameters', async () => {
    const mockProcess = createMockProcess()
    mockSpawn.mockReturnValue(mockProcess)

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
        FfprobeService,
      )
      injector.setExplicitInstance(
        { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
        HwAccelDetector,
      )

      const service = injector.getInstance(TranscodingSessionService)
      try {
        const session1 = await service.getOrCreateSession({
          driveLetter: 'A',
          path: 'test.mkv',
          mode: 'transcode',
          resolution: '720p',
        })
        const session2 = await service.getOrCreateSession({
          driveLetter: 'A',
          path: 'test.mkv',
          mode: 'transcode',
          resolution: '1080p',
        })

        expect(session1).not.toBe(session2)
        expect(mockSpawn).toHaveBeenCalledTimes(2)
        expect(service.getActiveSessionCount()).toBe(2)
      } finally {
        service.dispose()
      }
    })
  })

  it('should track active session count', async () => {
    const mockProcess = createMockProcess()
    mockSpawn.mockReturnValue(mockProcess)

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
        FfprobeService,
      )
      injector.setExplicitInstance(
        { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
        HwAccelDetector,
      )

      const service = injector.getInstance(TranscodingSessionService)
      try {
        expect(service.getActiveSessionCount()).toBe(0)

        await service.getOrCreateSession({
          driveLetter: 'A',
          path: 'test.mkv',
          mode: 'transcode',
        })

        expect(service.getActiveSessionCount()).toBe(1)
      } finally {
        service.dispose()
      }
    })
  })

  it('should remove session via removeSession', async () => {
    const mockProcess = createMockProcess()
    mockSpawn.mockReturnValue(mockProcess)

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
        FfprobeService,
      )
      injector.setExplicitInstance(
        { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
        HwAccelDetector,
      )

      const service = injector.getInstance(TranscodingSessionService)
      try {
        await service.getOrCreateSession({
          driveLetter: 'A',
          path: 'test.mkv',
          mode: 'transcode',
        })

        expect(service.getActiveSessionCount()).toBe(1)

        service.removeSession('A', 'test.mkv', 'transcode')
        expect(service.getActiveSessionCount()).toBe(0)
        expect(service.getSession('A', 'test.mkv', 'transcode')).toBeUndefined()
      } finally {
        service.dispose()
      }
    })
  })

  it('should kill ffmpeg processes on dispose', async () => {
    const mockProcess = createMockProcess()
    mockSpawn.mockReturnValue(mockProcess)

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
        FfprobeService,
      )
      injector.setExplicitInstance(
        { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
        HwAccelDetector,
      )

      const service = injector.getInstance(TranscodingSessionService)

      await service.getOrCreateSession({
        driveLetter: 'A',
        path: 'test.mkv',
        mode: 'transcode',
      })

      service.dispose()

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM')
      expect(service.getActiveSessionCount()).toBe(0)
    })
  })

  describe('waitForFile', () => {
    const testDir = join(tmpdir(), 'pirat-test-waitforfile')

    beforeEach(() => {
      if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true })
    })

    afterEach(() => {
      if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true })
    })

    it('should return true when file exists with non-zero size', async () => {
      vi.useRealTimers()
      const filePath = join(testDir, 'test-file.mp4')
      writeFileSync(filePath, 'content')

      const service = new TranscodingSessionService()
      try {
        const mockSessionEntry = { state: 'running' as const } as Parameters<typeof service.waitForFile>[1]
        const result = await service.waitForFile(filePath, mockSessionEntry)
        expect(result).toBe(true)
      } finally {
        service.dispose()
      }
    })

    it('should return false when session is in error state and file does not exist', async () => {
      vi.useRealTimers()
      const filePath = join(testDir, 'nonexistent.mp4')

      const service = new TranscodingSessionService()
      try {
        const mockSessionEntry = { state: 'error' as const } as Parameters<typeof service.waitForFile>[1]
        const result = await service.waitForFile(filePath, mockSessionEntry)
        expect(result).toBe(false)
      } finally {
        service.dispose()
      }
    })
  })

  describe('waitForSegment', () => {
    const testDir = join(tmpdir(), 'pirat-test-waitforsegment')

    beforeEach(() => {
      if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true })
    })

    afterEach(() => {
      if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true })
    })

    it('should return true when segment and next segment exist', async () => {
      vi.useRealTimers()
      writeFileSync(join(testDir, 'segment0.m4s'), 'seg0')
      writeFileSync(join(testDir, 'segment1.m4s'), 'seg1')

      const service = new TranscodingSessionService()
      try {
        const mockSessionEntry = {
          sessionDir: testDir,
          state: 'running' as const,
        } as Parameters<typeof service.waitForSegment>[0]
        const result = await service.waitForSegment(mockSessionEntry, 0)
        expect(result).toBe(true)
      } finally {
        service.dispose()
      }
    })

    it('should return true for last segment when session is completed', async () => {
      vi.useRealTimers()
      writeFileSync(join(testDir, 'segment5.m4s'), 'seg5')

      const service = new TranscodingSessionService()
      try {
        const mockSessionEntry = {
          sessionDir: testDir,
          state: 'completed' as const,
        } as Parameters<typeof service.waitForSegment>[0]
        const result = await service.waitForSegment(mockSessionEntry, 5)
        expect(result).toBe(true)
      } finally {
        service.dispose()
      }
    })

    it('should return false when session errors without producing segment', async () => {
      vi.useRealTimers()
      const service = new TranscodingSessionService()
      try {
        const mockSessionEntry = {
          sessionDir: testDir,
          state: 'error' as const,
        } as Parameters<typeof service.waitForSegment>[0]
        const result = await service.waitForSegment(mockSessionEntry, 0)
        expect(result).toBe(false)
      } finally {
        service.dispose()
      }
    })
  })

  describe('disk usage and cache eviction', () => {
    const testDir = join(tmpdir(), 'pirat-test-diskusage')

    beforeEach(() => {
      if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true })
    })

    afterEach(() => {
      if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true })
    })

    it('should calculate session disk usage', () => {
      const sessionDir = join(testDir, 'session1')
      mkdirSync(sessionDir, { recursive: true })
      writeFileSync(join(sessionDir, 'segment0.m4s'), Buffer.alloc(1000))
      writeFileSync(join(sessionDir, 'segment1.m4s'), Buffer.alloc(2000))
      writeFileSync(join(sessionDir, 'init.mp4'), Buffer.alloc(500))

      const service = new TranscodingSessionService()
      try {
        const mockSession = { sessionDir } as Parameters<typeof service.getSessionDiskUsage>[0]
        const usage = service.getSessionDiskUsage(mockSession)
        expect(usage).toBe(3500)
      } finally {
        service.dispose()
      }
    })

    it('should return 0 for non-existent session directory', () => {
      const service = new TranscodingSessionService()
      try {
        const mockSession = { sessionDir: join(testDir, 'nonexistent') } as Parameters<
          typeof service.getSessionDiskUsage
        >[0]
        const usage = service.getSessionDiskUsage(mockSession)
        expect(usage).toBe(0)
      } finally {
        service.dispose()
      }
    })

    it('should calculate total disk usage across sessions', async () => {
      const mockProcess = createMockProcess()
      mockSpawn.mockReturnValue(mockProcess)

      await usingAsync(new Injector(), async (injector) => {
        injector.setExplicitInstance(
          { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
          FfprobeService,
        )
        injector.setExplicitInstance(
          { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
          HwAccelDetector,
        )

        const service = injector.getInstance(TranscodingSessionService)
        try {
          const s1 = await service.getOrCreateSession({
            driveLetter: 'A',
            path: 'test1.mkv',
            mode: 'transcode',
          })
          const s2 = await service.getOrCreateSession({
            driveLetter: 'A',
            path: 'test2.mkv',
            mode: 'transcode',
          })

          writeFileSync(join(s1.sessionDir, 'segment0.m4s'), Buffer.alloc(100))
          writeFileSync(join(s2.sessionDir, 'segment0.m4s'), Buffer.alloc(200))

          const total = service.getTotalDiskUsage()
          expect(total).toBe(300)
        } finally {
          service.dispose()
        }
      })
    })
  })

  describe('ffmpeg process state transitions', () => {
    it('should transition to running when stderr contains "Opening"', async () => {
      const mockProcess = createMockProcess()
      mockSpawn.mockReturnValue(mockProcess)

      await usingAsync(new Injector(), async (injector) => {
        injector.setExplicitInstance(
          { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
          FfprobeService,
        )
        injector.setExplicitInstance(
          { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
          HwAccelDetector,
        )

        const service = injector.getInstance(TranscodingSessionService)
        try {
          const session = await service.getOrCreateSession({
            driveLetter: 'A',
            path: 'test.mkv',
            mode: 'transcode',
          })

          expect(session.state).toBe('starting')

          const stderrHandler = mockProcess._stderrHandlers.data?.[0]
          stderrHandler?.(Buffer.from('Opening output file for writing'))

          expect(session.state).toBe('running')
        } finally {
          service.dispose()
        }
      })
    })

    it('should not transition from running back to running on subsequent stderr', async () => {
      const mockProcess = createMockProcess()
      mockSpawn.mockReturnValue(mockProcess)

      await usingAsync(new Injector(), async (injector) => {
        injector.setExplicitInstance(
          { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
          FfprobeService,
        )
        injector.setExplicitInstance(
          { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
          HwAccelDetector,
        )

        const service = injector.getInstance(TranscodingSessionService)
        try {
          const session = await service.getOrCreateSession({
            driveLetter: 'A',
            path: 'test.mkv',
            mode: 'transcode',
          })

          const stderrHandler = mockProcess._stderrHandlers.data?.[0]
          stderrHandler?.(Buffer.from('Opening output file'))
          expect(session.state).toBe('running')

          stderrHandler?.(Buffer.from('frame=100 fps=25'))
          expect(session.state).toBe('running')
        } finally {
          service.dispose()
        }
      })
    })

    it('should transition to completed when ffmpeg exits with code 0', async () => {
      const mockProcess = createMockProcess()
      mockSpawn.mockReturnValue(mockProcess)

      await usingAsync(new Injector(), async (injector) => {
        injector.setExplicitInstance(
          { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
          FfprobeService,
        )
        injector.setExplicitInstance(
          { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
          HwAccelDetector,
        )

        const service = injector.getInstance(TranscodingSessionService)
        try {
          const session = await service.getOrCreateSession({
            driveLetter: 'A',
            path: 'test.mkv',
            mode: 'transcode',
          })

          const closeHandler = mockProcess._processHandlers.close?.[0]
          closeHandler?.(0)

          expect(session.state).toBe('completed')
        } finally {
          service.dispose()
        }
      })
    })

    it('should transition to error when ffmpeg exits with non-zero code', async () => {
      const mockProcess = createMockProcess()
      mockSpawn.mockReturnValue(mockProcess)

      await usingAsync(new Injector(), async (injector) => {
        injector.setExplicitInstance(
          { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
          FfprobeService,
        )
        injector.setExplicitInstance(
          { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
          HwAccelDetector,
        )

        const service = injector.getInstance(TranscodingSessionService)
        try {
          const session = await service.getOrCreateSession({
            driveLetter: 'A',
            path: 'test.mkv',
            mode: 'transcode',
          })

          const closeHandler = mockProcess._processHandlers.close?.[0]
          closeHandler?.(1)

          expect(session.state).toBe('error')
        } finally {
          service.dispose()
        }
      })
    })

    it('should transition to error when ffmpeg emits error event', async () => {
      const mockProcess = createMockProcess()
      mockSpawn.mockReturnValue(mockProcess)

      await usingAsync(new Injector(), async (injector) => {
        injector.setExplicitInstance(
          { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
          FfprobeService,
        )
        injector.setExplicitInstance(
          { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
          HwAccelDetector,
        )

        const service = injector.getInstance(TranscodingSessionService)
        try {
          const session = await service.getOrCreateSession({
            driveLetter: 'A',
            path: 'test.mkv',
            mode: 'transcode',
          })

          const errorHandler = mockProcess._processHandlers.error?.[0]
          errorHandler?.(new Error('spawn ENOENT'))

          expect(session.state).toBe('error')
        } finally {
          service.dispose()
        }
      })
    })
  })

  describe('readPlaylist', () => {
    const testDir = join(tmpdir(), 'pirat-test-readplaylist')

    beforeEach(() => {
      if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true })
    })

    afterEach(() => {
      if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true })
    })

    it('should return playlist content when file exists and has ENDLIST', async () => {
      vi.useRealTimers()
      const playlistContent = '#EXTM3U\n#EXT-X-VERSION:7\n#EXT-X-ENDLIST\n'
      writeFileSync(join(testDir, 'playlist.m3u8'), playlistContent)

      const service = new TranscodingSessionService()
      try {
        const mockSession = {
          sessionDir: testDir,
          state: 'running' as const,
          totalDuration: 60,
        } as Parameters<typeof service.readPlaylist>[0]

        const result = await service.readPlaylist(mockSession)
        expect(result).toBe(playlistContent)
      } finally {
        service.dispose()
      }
    })

    it('should pad playlist with remaining segments when ENDLIST is missing', async () => {
      vi.useRealTimers()
      const playlistContent = [
        '#EXTM3U',
        '#EXT-X-VERSION:7',
        '#EXT-X-TARGETDURATION:6',
        '#EXT-X-MAP:URI="init.mp4"',
        '#EXTINF:6.000000,',
        'segment0.m4s',
        '#EXTINF:6.000000,',
        'segment1.m4s',
        '',
      ].join('\n')
      writeFileSync(join(testDir, 'playlist.m3u8'), playlistContent)

      const service = new TranscodingSessionService()
      try {
        const mockSession = {
          sessionDir: testDir,
          state: 'running' as const,
          totalDuration: 30,
        } as Parameters<typeof service.readPlaylist>[0]

        const result = await service.readPlaylist(mockSession)
        expect(result).toContain('#EXT-X-ENDLIST')
        expect(result).toContain('segment2.m4s')
        expect(result).toContain('segment3.m4s')
        expect(result).toContain('segment4.m4s')
      } finally {
        service.dispose()
      }
    })

    it('should add ENDLIST when all segments are already encoded', async () => {
      vi.useRealTimers()
      const playlistContent = [
        '#EXTM3U',
        '#EXT-X-VERSION:7',
        '#EXT-X-TARGETDURATION:6',
        '#EXTINF:6.000000,',
        'segment0.m4s',
        '#EXTINF:6.000000,',
        'segment1.m4s',
        '',
      ].join('\n')
      writeFileSync(join(testDir, 'playlist.m3u8'), playlistContent)

      const service = new TranscodingSessionService()
      try {
        const mockSession = {
          sessionDir: testDir,
          state: 'running' as const,
          totalDuration: 12,
        } as Parameters<typeof service.readPlaylist>[0]

        const result = await service.readPlaylist(mockSession)
        expect(result).toContain('#EXT-X-ENDLIST')
        expect(result).not.toContain('segment2.m4s')
      } finally {
        service.dispose()
      }
    })

    it('should return null when session errors before playlist is created', async () => {
      vi.useRealTimers()
      const service = new TranscodingSessionService()
      try {
        const mockSession = {
          sessionDir: testDir,
          state: 'error' as const,
          totalDuration: 60,
        } as Parameters<typeof service.readPlaylist>[0]

        const result = await service.readPlaylist(mockSession)
        expect(result).toBeNull()
      } finally {
        service.dispose()
      }
    })
  })

  describe('removeAllSessionsForFile', () => {
    it('should remove all sessions for a file regardless of mode, audioTrack, and resolution', async () => {
      const mockProcess = createMockProcess()
      mockSpawn.mockReturnValue(mockProcess)

      await usingAsync(new Injector(), async (injector) => {
        injector.setExplicitInstance(
          { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
          FfprobeService,
        )
        injector.setExplicitInstance(
          { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
          HwAccelDetector,
        )

        const service = injector.getInstance(TranscodingSessionService)
        try {
          await service.getOrCreateSession({
            driveLetter: 'A',
            path: 'test.mkv',
            mode: 'transcode',
            resolution: '1080p',
          })
          await service.getOrCreateSession({
            driveLetter: 'A',
            path: 'test.mkv',
            mode: 'transcode',
            resolution: '720p',
          })
          await service.getOrCreateSession({
            driveLetter: 'A',
            path: 'test.mkv',
            mode: 'direct-stream',
            audioTrackId: 1,
          })
          await service.getOrCreateSession({
            driveLetter: 'A',
            path: 'other.mkv',
            mode: 'transcode',
            resolution: '1080p',
          })

          expect(service.getActiveSessionCount()).toBe(4)

          service.removeAllSessionsForFile('A', 'test.mkv')
          expect(service.getActiveSessionCount()).toBe(1)
          expect(service.getSession('A', 'other.mkv', 'transcode', 0, '1080p')).toBeDefined()
        } finally {
          service.dispose()
        }
      })
    })

    it('should handle no matching sessions gracefully', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const service = injector.getInstance(TranscodingSessionService)
        try {
          service.removeAllSessionsForFile('Z', 'nonexistent.mkv')
          expect(service.getActiveSessionCount()).toBe(0)
        } finally {
          service.dispose()
        }
      })
    })
  })

  it('should handle removeSession on non-existent session gracefully', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const service = injector.getInstance(TranscodingSessionService)
      try {
        service.removeSession('Z', 'nonexistent.mkv', 'transcode')
        expect(service.getActiveSessionCount()).toBe(0)
      } finally {
        service.dispose()
      }
    })
  })

  it('should handle destroySession when process is already killed', async () => {
    const mockProcess = createMockProcess()
    mockProcess.killed = true
    mockSpawn.mockReturnValue(mockProcess)

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
        FfprobeService,
      )
      injector.setExplicitInstance(
        { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
        HwAccelDetector,
      )

      const service = injector.getInstance(TranscodingSessionService)
      await service.getOrCreateSession({
        driveLetter: 'A',
        path: 'test.mkv',
        mode: 'transcode',
      })

      service.dispose()

      expect(mockProcess.kill).not.toHaveBeenCalled()
      expect(service.getActiveSessionCount()).toBe(0)
    })
  })

  it('should update lastAccessedAt when getSession is called', async () => {
    const mockProcess = createMockProcess()
    mockSpawn.mockReturnValue(mockProcess)

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
        FfprobeService,
      )
      injector.setExplicitInstance(
        { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
        HwAccelDetector,
      )

      const service = injector.getInstance(TranscodingSessionService)
      try {
        const session = await service.getOrCreateSession({
          driveLetter: 'A',
          path: 'test.mkv',
          mode: 'transcode',
        })

        const initialAccessedAt = session.lastAccessedAt

        await new Promise((resolve) => setTimeout(resolve, 10))

        service.getSession('A', 'test.mkv', 'transcode', 0)
        expect(session.lastAccessedAt).toBeGreaterThan(initialAccessedAt)
      } finally {
        service.dispose()
      }
    })
  })

  describe('buildHlsFfmpegArgs via getOrCreateSession', () => {
    it('should use -c:v copy and -c:a copy for remux mode', async () => {
      const mockProcess = createMockProcess()
      mockSpawn.mockReturnValue(mockProcess)

      await usingAsync(new Injector(), async (injector) => {
        injector.setExplicitInstance(
          { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
          FfprobeService,
        )
        injector.setExplicitInstance(
          { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
          HwAccelDetector,
        )

        const service = injector.getInstance(TranscodingSessionService)
        try {
          await service.getOrCreateSession({
            driveLetter: 'A',
            path: 'test.mkv',
            mode: 'remux',
          })

          const lastCall = mockSpawn.mock.lastCall as [string, string[]]
          const args = lastCall[1]
          expect(args).toContain('-c:v')
          expect(args[args.indexOf('-c:v') + 1]).toBe('copy')
          expect(args).toContain('-c:a')
          expect(args[args.indexOf('-c:a') + 1]).toBe('copy')
          expect(args).toContain('-f')
          expect(args[args.indexOf('-f') + 1]).toBe('hls')
        } finally {
          service.dispose()
        }
      })
    })

    it('should use -c:v copy and transcode audio for direct-stream mode', async () => {
      const mockProcess = createMockProcess()
      mockSpawn.mockReturnValue(mockProcess)

      await usingAsync(new Injector(), async (injector) => {
        injector.setExplicitInstance(
          { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
          FfprobeService,
        )
        injector.setExplicitInstance(
          { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
          HwAccelDetector,
        )

        const service = injector.getInstance(TranscodingSessionService)
        try {
          await service.getOrCreateSession({
            driveLetter: 'A',
            path: 'test.mkv',
            mode: 'direct-stream',
          })

          const lastCall = mockSpawn.mock.lastCall as [string, string[]]
          const args = lastCall[1]
          expect(args[args.indexOf('-c:v') + 1]).toBe('copy')
          expect(args[args.indexOf('-c:a') + 1]).toBe('aac')
        } finally {
          service.dispose()
        }
      })
    })

    it('should include resolution flag for transcode mode', async () => {
      const mockProcess = createMockProcess()
      mockSpawn.mockReturnValue(mockProcess)

      await usingAsync(new Injector(), async (injector) => {
        injector.setExplicitInstance(
          { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
          FfprobeService,
        )
        injector.setExplicitInstance(
          { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
          HwAccelDetector,
        )

        const service = injector.getInstance(TranscodingSessionService)
        try {
          await service.getOrCreateSession({
            driveLetter: 'A',
            path: 'test.mkv',
            mode: 'transcode',
            resolution: '720p',
          })

          const lastCall = mockSpawn.mock.lastCall as [string, string[]]
          const args = lastCall[1]
          expect(args).toContain('-s')
          expect(args[args.indexOf('-s') + 1]).toBe('1280x720')
        } finally {
          service.dispose()
        }
      })
    })

    it('should include HLS muxer flags', async () => {
      const mockProcess = createMockProcess()
      mockSpawn.mockReturnValue(mockProcess)

      await usingAsync(new Injector(), async (injector) => {
        injector.setExplicitInstance(
          { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
          FfprobeService,
        )
        injector.setExplicitInstance(
          { getEncoder: vi.fn().mockResolvedValue('libx264') } as unknown as HwAccelDetector,
          HwAccelDetector,
        )

        const service = injector.getInstance(TranscodingSessionService)
        try {
          await service.getOrCreateSession({
            driveLetter: 'A',
            path: 'test.mkv',
            mode: 'transcode',
          })

          const lastCall = mockSpawn.mock.lastCall as [string, string[]]
          const args = lastCall[1]
          expect(args).toContain('-hls_segment_type')
          expect(args[args.indexOf('-hls_segment_type') + 1]).toBe('fmp4')
          expect(args).toContain('-hls_fmp4_init_filename')
          expect(args[args.indexOf('-hls_fmp4_init_filename') + 1]).toBe('init.mp4')
          expect(args).toContain('-hls_flags')
          expect(args[args.indexOf('-hls_flags') + 1]).toBe('independent_segments')
        } finally {
          service.dispose()
        }
      })
    })
  })
})
