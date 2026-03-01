import { useSystemIdentityContext } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import { getLogger, type ScopedLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import type { PlaybackMode } from 'common'
import { Config, Drive, type MoviesConfig } from 'common'
import { spawn, type ChildProcess } from 'child_process'
import { createHash } from 'crypto'
import { existsSync, mkdirSync, rmSync, statSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { FfprobeService } from '../../../ffprobe-service.js'
import { HwAccelDetector } from './hw-accel-detector.js'

type SessionKey = string

type SessionState = 'starting' | 'running' | 'completed' | 'error'

type TranscodingSessionEntry = {
  key: SessionKey
  sessionDir: string
  ffmpegProcess: ChildProcess
  state: SessionState
  mode: PlaybackMode
  driveLetter: string
  path: string
  audioTrackId: number
  resolution?: string
  createdAt: number
  lastAccessedAt: number
}

const SESSION_IDLE_TIMEOUT_MS = 5 * 60 * 1000
const SEGMENT_DURATION = 6
const WAIT_POLL_INTERVAL_MS = 100
const WAIT_TIMEOUT_MS = 60_000

@Injectable({ lifetime: 'singleton' })
export class TranscodingSessionService {
  declare injector: Injector

  @Injected((injector) => getLogger(injector).withScope('TranscodingSession'))
  declare private logger: ScopedLogger

  @Injected((injector) => useSystemIdentityContext({ injector, username: 'transcoding-session' }))
  declare private systemInjector: Injector

  private sessions = new Map<SessionKey, TranscodingSessionEntry>()
  private pendingSessions = new Map<SessionKey, Promise<TranscodingSessionEntry>>()
  private cleanupInterval: ReturnType<typeof setInterval>

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanupIdleSessions(), SESSION_IDLE_TIMEOUT_MS / 2)
  }

  public dispose() {
    clearInterval(this.cleanupInterval)
    for (const session of this.sessions.values()) {
      this.destroySession(session)
    }
    this.sessions.clear()
  }

  private buildSessionKey(
    driveLetter: string,
    path: string,
    mode: PlaybackMode,
    audioTrackId: number,
    resolution?: string,
  ): SessionKey {
    return `${driveLetter}:${path}:${mode}:${audioTrackId}:${resolution || ''}`
  }

  private getSessionDir(key: SessionKey): string {
    const hash = createHash('sha256').update(key).digest('hex').slice(0, 24)
    return join(this.getBaseDir(), hash)
  }

  private baseDirCache: string | null = null
  private getBaseDir(): string {
    if (this.baseDirCache) return this.baseDirCache
    this.baseDirCache = join(tmpdir(), 'pirat-hls-sessions')
    if (!existsSync(this.baseDirCache)) {
      mkdirSync(this.baseDirCache, { recursive: true })
    }
    return this.baseDirCache
  }

  public async getBaseDirFromConfig(): Promise<string> {
    try {
      const configDataSet = getDataSetFor(this.injector, Config, 'id')
      const config = (await configDataSet.get(this.systemInjector, 'MOVIES_CONFIG')) as MoviesConfig | undefined
      const dir = config?.value?.hlsSegmentPath || join(tmpdir(), 'pirat-hls-sessions')
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
      this.baseDirCache = dir
      return dir
    } catch {
      return this.getBaseDir()
    }
  }

  public getSession(
    driveLetter: string,
    path: string,
    mode: PlaybackMode,
    audioTrackId: number = 0,
    resolution?: string,
  ): TranscodingSessionEntry | undefined {
    const key = this.buildSessionKey(driveLetter, path, mode, audioTrackId, resolution)
    const session = this.sessions.get(key)
    if (session) {
      session.lastAccessedAt = Date.now()
    }
    return session
  }

  public async getOrCreateSession({
    driveLetter,
    path,
    mode,
    audioTrackId = 0,
    resolution,
  }: {
    driveLetter: string
    path: string
    mode: PlaybackMode
    audioTrackId?: number
    resolution?: string
  }): Promise<TranscodingSessionEntry> {
    const key = this.buildSessionKey(driveLetter, path, mode, audioTrackId, resolution)
    const existing = this.sessions.get(key)
    if (existing) {
      existing.lastAccessedAt = Date.now()
      return existing
    }

    const pending = this.pendingSessions.get(key)
    if (pending) return pending

    const createPromise = this.createSession(key, driveLetter, path, mode, audioTrackId, resolution)
    this.pendingSessions.set(key, createPromise)

    try {
      return await createPromise
    } finally {
      this.pendingSessions.delete(key)
    }
  }

  private async createSession(
    key: SessionKey,
    driveLetter: string,
    path: string,
    mode: PlaybackMode,
    audioTrackId: number,
    resolution?: string,
  ): Promise<TranscodingSessionEntry> {
    await this.getBaseDirFromConfig()
    const sessionDir = this.getSessionDir(key)
    if (!existsSync(sessionDir)) {
      mkdirSync(sessionDir, { recursive: true })
    }

    const ffmpegArgs = await this.buildHlsFfmpegArgs({
      driveLetter,
      path,
      mode,
      audioTrackId,
      resolution,
      sessionDir,
    })

    void this.logger.verbose({
      message: `Creating HLS session`,
      data: { key, mode, sessionDir, cmd: `ffmpeg ${ffmpegArgs.join(' ')}` },
    })

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
      stdio: ['ignore', 'ignore', 'pipe'],
    })

    const session: TranscodingSessionEntry = {
      key,
      sessionDir,
      ffmpegProcess,
      state: 'starting',
      mode,
      driveLetter,
      path,
      audioTrackId,
      resolution,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    }

    ffmpegProcess.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString().trim()
      if (session.state === 'starting' && msg.includes('Opening')) {
        session.state = 'running'
      }
      void this.logger.verbose({ message: `[${key}] ${msg}` })
    })

    ffmpegProcess.on('error', (err) => {
      void this.logger.error({ message: `[${key}] ffmpeg error: ${err.message}` })
      session.state = 'error'
    })

    ffmpegProcess.on('close', (code) => {
      void this.logger.verbose({ message: `[${key}] ffmpeg exited with code ${code}` })
      session.state = code === 0 ? 'completed' : 'error'
    })

    this.sessions.set(key, session)
    return session
  }

  /**
   * Waits for a file to appear on disk and be fully written.
   * A file is considered ready when the NEXT segment exists or ffmpeg has exited.
   */
  public async waitForFile(filePath: string, session: TranscodingSessionEntry): Promise<boolean> {
    const deadline = Date.now() + WAIT_TIMEOUT_MS

    while (Date.now() < deadline) {
      if (existsSync(filePath)) {
        // For segments, check that the file has non-zero size
        try {
          const stat = statSync(filePath)
          if (stat.size > 0) return true
        } catch {
          // File might have been deleted between check and stat
        }
      }

      if (session.state === 'error') return false
      if (session.state === 'completed' && !existsSync(filePath)) return false

      await new Promise((resolve) => setTimeout(resolve, WAIT_POLL_INTERVAL_MS))
    }

    return existsSync(filePath)
  }

  /**
   * Waits for a segment to be ready. A segment is ready when the NEXT segment file
   * exists (guaranteeing the current one is fully written) or ffmpeg has finished.
   */
  public async waitForSegment(session: TranscodingSessionEntry, segmentIndex: number): Promise<boolean> {
    const segmentPath = join(session.sessionDir, `segment${segmentIndex}.m4s`)
    const nextSegmentPath = join(session.sessionDir, `segment${segmentIndex + 1}.m4s`)
    const deadline = Date.now() + WAIT_TIMEOUT_MS

    while (Date.now() < deadline) {
      if (existsSync(segmentPath)) {
        // Segment is fully written if the next one exists or ffmpeg is done
        if (existsSync(nextSegmentPath) || session.state === 'completed' || session.state === 'error') {
          return true
        }
      }

      if (session.state === 'error') return false

      await new Promise((resolve) => setTimeout(resolve, WAIT_POLL_INTERVAL_MS))
    }

    return existsSync(segmentPath)
  }

  public async readPlaylist(session: TranscodingSessionEntry): Promise<string | null> {
    const playlistPath = join(session.sessionDir, 'playlist.m3u8')
    const ready = await this.waitForFile(playlistPath, session)
    if (!ready) return null
    return readFile(playlistPath, 'utf-8')
  }

  private async buildHlsFfmpegArgs({
    driveLetter,
    path,
    mode,
    audioTrackId,
    resolution,
    sessionDir,
  }: {
    driveLetter: string
    path: string
    mode: PlaybackMode
    audioTrackId: number
    resolution?: string
    sessionDir: string
  }): Promise<string[]> {
    const [drive, config, ffprobe] = await Promise.all([
      (async () => {
        const driveDataSet = getDataSetFor(this.injector, Drive, 'letter')
        return driveDataSet.get(this.systemInjector, driveLetter)
      })(),
      (async () => {
        const configDataSet = getDataSetFor(this.injector, Config, 'id')
        const c = await configDataSet.get(this.systemInjector, 'MOVIES_CONFIG')
        return c as MoviesConfig | undefined
      })(),
      this.injector.getInstance(FfprobeService).getFfprobeForPiratFile({ driveLetter, path }),
    ])

    if (!drive) throw new Error(`Drive ${driveLetter} not found`)

    const fullPath = join(drive.physicalPath, path)
    const audioStreams = ffprobe.streams.filter((s) => s.codec_type === 'audio')
    const audioStream = audioStreams.find((t) => t.index === audioTrackId) || audioStreams[0]

    const isRemux = mode === 'remux'
    const isDirectStream = mode === 'direct-stream'
    const copyVideo = isRemux || isDirectStream
    const copyAudio = isRemux

    const args: string[] = []

    // Input with timestamp preservation (like Jellyfin)
    args.push('-copyts', '-avoid_negative_ts', 'disabled')
    args.push('-i', fullPath)

    // Thread config
    const threads = config?.value?.threads
    if (threads && threads > 0) {
      args.push('-threads', String(threads))
    }

    // Stream mapping
    const audioStreamIndex = Math.max(
      0,
      audioStreams.findIndex((s) => s === audioStream),
    )
    args.push('-map', '0:v:0')
    args.push('-map', `0:a:${audioStreamIndex}`)

    // Audio codec
    if (copyAudio) {
      args.push('-c:a', 'copy')
    } else {
      args.push('-c:a', 'aac', '-b:a', '128k')
    }

    // Video codec
    if (copyVideo) {
      args.push('-c:v', 'copy')
    } else {
      const requestedCodec = 'libx264'
      let videoCodec: string = requestedCodec

      const hwAccelMethod = config?.value?.hwAccelMethod
      if (hwAccelMethod && hwAccelMethod !== 'none') {
        try {
          const hwDetector = this.injector.getInstance(HwAccelDetector)
          videoCodec = await hwDetector.getEncoder('h264', hwAccelMethod)
        } catch {
          videoCodec = requestedCodec
        }
      }

      args.push('-c:v', videoCodec)

      // Force keyframes at segment boundaries
      args.push('-force_key_frames', `expr:gte(t,n_forced*${SEGMENT_DURATION})`)
      args.push('-sc_threshold:v', '0')

      const isSoftwareEncoder = videoCodec === 'libx264' || videoCodec === 'libx265'
      if (isSoftwareEncoder) {
        args.push('-preset', config?.value?.preset ?? 'ultrafast')
      }

      if (resolution) {
        const resMap: Record<string, string> = {
          '4k': '3840x2160',
          '1080p': '1920x1080',
          '720p': '1280x720',
          '480p': '854x480',
          '360p': '640x360',
        }
        if (resMap[resolution]) {
          args.push('-s', resMap[resolution])
        }
      }
    }

    // HLS muxer output (the core change from per-segment to continuous)
    args.push('-f', 'hls')
    args.push('-hls_time', String(SEGMENT_DURATION))
    args.push('-hls_segment_type', 'fmp4')
    args.push('-hls_fmp4_init_filename', 'init.mp4')
    args.push('-hls_segment_filename', join(sessionDir, 'segment%d.m4s'))
    args.push('-hls_flags', 'independent_segments')
    args.push('-hls_list_size', '0')
    args.push('-y', join(sessionDir, 'playlist.m3u8'))

    return args
  }

  public getActiveSessionCount(): number {
    return this.sessions.size
  }

  public removeSession(
    driveLetter: string,
    path: string,
    mode: PlaybackMode,
    audioTrackId: number = 0,
    resolution?: string,
  ) {
    const key = this.buildSessionKey(driveLetter, path, mode, audioTrackId, resolution)
    const session = this.sessions.get(key)
    if (session) {
      this.destroySession(session)
      this.sessions.delete(key)
    }
  }

  private cleanupIdleSessions() {
    const now = Date.now()
    const keysToRemove: SessionKey[] = []
    for (const [key, session] of this.sessions) {
      if (now - session.lastAccessedAt > SESSION_IDLE_TIMEOUT_MS) {
        keysToRemove.push(key)
      }
    }
    for (const key of keysToRemove) {
      const session = this.sessions.get(key)
      if (session) {
        void this.logger.verbose({ message: `Cleaning up idle session: ${key}` })
        this.destroySession(session)
        this.sessions.delete(key)
      }
    }
  }

  private destroySession(session: TranscodingSessionEntry) {
    try {
      if (!session.ffmpegProcess.killed) {
        session.ffmpegProcess.kill('SIGTERM')
      }
    } catch {
      // Process may already be dead
    }

    // Clean up session directory
    try {
      if (existsSync(session.sessionDir)) {
        rmSync(session.sessionDir, { recursive: true, force: true })
      }
    } catch {
      // Directory cleanup is best-effort
    }
  }
}
