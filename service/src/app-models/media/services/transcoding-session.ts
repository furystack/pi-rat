import { Injectable, Injected, type Injector } from '@furystack/inject'
import { getLogger, type ScopedLogger } from '@furystack/logging'
import type { PlaybackMode, StreamQueryParams } from 'common'
import { spawn, type ChildProcess } from 'child_process'
import { StreamFileActionCaches } from './stream-file-action-caches.js'

type SessionKey = string

type TranscodingSessionEntry = {
  key: SessionKey
  ffmpegProcess: ChildProcess
  mode: PlaybackMode
  driveLetter: string
  path: string
  createdAt: number
  lastAccessedAt: number
  segmentsReady: Set<number>
}

const SESSION_IDLE_TIMEOUT_MS = 5 * 60 * 1000

@Injectable({ lifetime: 'singleton' })
export class TranscodingSessionService {
  declare injector: Injector

  @Injected((injector) => getLogger(injector).withScope('TranscodingSessionService'))
  declare private logger: ScopedLogger

  private sessions = new Map<SessionKey, TranscodingSessionEntry>()
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

  private buildSessionKey(driveLetter: string, path: string, mode: PlaybackMode, audioTrackId?: number): SessionKey {
    return `${driveLetter}:${path}:${mode}:${audioTrackId ?? 0}`
  }

  public getSession(
    driveLetter: string,
    path: string,
    mode: PlaybackMode,
    audioTrackId?: number,
  ): TranscodingSessionEntry | undefined {
    const key = this.buildSessionKey(driveLetter, path, mode, audioTrackId)
    const session = this.sessions.get(key)
    if (session) {
      session.lastAccessedAt = Date.now()
    }
    return session
  }

  public async createSession({
    driveLetter,
    path,
    mode,
    audioTrackId,
    queryParams,
  }: {
    driveLetter: string
    path: string
    mode: PlaybackMode
    audioTrackId?: number
    queryParams: StreamQueryParams
  }): Promise<TranscodingSessionEntry> {
    const key = this.buildSessionKey(driveLetter, path, mode, audioTrackId)

    const existing = this.sessions.get(key)
    if (existing) {
      existing.lastAccessedAt = Date.now()
      return existing
    }

    const cache = this.injector.getInstance(StreamFileActionCaches)
    const ffmpegArgs = await cache.ffMpegArgsCache.get({
      file: { driveLetter, path },
      queryParams,
      injector: this.injector,
    })

    void this.logger.verbose({
      message: `Creating transcoding session`,
      data: { key, mode, args: ffmpegArgs.join(' ') },
    })

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    ffmpegProcess.stderr.on('data', (data: Buffer) => {
      void this.logger.verbose({ message: `[${key}] ffmpeg: ${data.toString().trim()}` })
    })

    ffmpegProcess.on('error', (err) => {
      void this.logger.error({ message: `[${key}] ffmpeg error: ${err.message}` })
      this.sessions.delete(key)
    })

    ffmpegProcess.on('close', (code) => {
      void this.logger.verbose({ message: `[${key}] ffmpeg exited with code ${code}` })
      this.sessions.delete(key)
    })

    const session: TranscodingSessionEntry = {
      key,
      ffmpegProcess,
      mode,
      driveLetter,
      path,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      segmentsReady: new Set(),
    }

    this.sessions.set(key, session)
    return session
  }

  public markSegmentReady(key: SessionKey, segmentIndex: number) {
    const session = this.sessions.get(key)
    if (session) {
      session.segmentsReady.add(segmentIndex)
    }
  }

  public isSegmentReady(key: SessionKey, segmentIndex: number): boolean {
    return this.sessions.get(key)?.segmentsReady.has(segmentIndex) ?? false
  }

  public removeSession(driveLetter: string, path: string, mode: PlaybackMode, audioTrackId?: number) {
    const key = this.buildSessionKey(driveLetter, path, mode, audioTrackId)
    const session = this.sessions.get(key)
    if (session) {
      this.destroySession(session)
      this.sessions.delete(key)
    }
  }

  public getActiveSessionCount(): number {
    return this.sessions.size
  }

  private cleanupIdleSessions() {
    const now = Date.now()
    for (const [key, session] of this.sessions) {
      if (now - session.lastAccessedAt > SESSION_IDLE_TIMEOUT_MS) {
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
  }
}
