import type { ScopedLogger } from '@furystack/logging'
import { ObservableValue } from '@furystack/utils'
import {
  encode,
  HLS_SEGMENT_DURATION,
  type AudioTrackInfo,
  type FfprobeData,
  type PiRatFile,
  type PlaybackInfoResponse,
  type PlaybackMode,
  type SubtitleTrackInfo,
} from 'common'
import Hls from 'hls.js'
import type { MediaApiClient } from '../../../services/api-clients/media-api-client.js'
import { environmentOptions } from '../../../utils/environment-options.js'

export const videoCodecs = {
  h264: 'avc1.42E01E',
  hevc: 'hev1.2.4.L120.B0',
  vp9: 'vp09.00.10.08',
  av1: 'av01.0.08M.08',
}

export const audioCodecs = {
  aac: 'mp4a.40.2',
  ac3: 'ac-3',
  eac3: 'ec-3',
  opus: 'opus',
  dts: 'dts+',
}

const buildCodecSupportMap = () => {
  const supportedVideo: string[] = []
  const supportedAudio: string[] = []

  if (typeof MediaSource !== 'undefined') {
    for (const [name, mime] of Object.entries(videoCodecs)) {
      if (MediaSource.isTypeSupported(`video/mp4; codecs="${mime}"`)) {
        supportedVideo.push(name)
      }
    }

    for (const [name, mime] of Object.entries(audioCodecs)) {
      if (MediaSource.isTypeSupported(`audio/mp4; codecs="${mime}"`)) {
        supportedAudio.push(name)
      }
    }
  }

  return {
    video: supportedVideo,
    audio: supportedAudio,
    containers: ['mp4', 'webm'],
  }
}

export type ResolutionValue = '4k' | '1080p' | '720p' | '480p' | '360p'

export class MoviePlayerService implements AsyncDisposable {
  constructor(
    private readonly file: PiRatFile,
    private readonly ffprobe: FfprobeData,
    private readonly api: MediaApiClient,
    private currentProgress: number,
    private readonly logger: ScopedLogger,
  ) {
    this.progress = new ObservableValue(this.currentProgress)
    this.hlsStartTime = Math.floor(this.currentProgress / HLS_SEGMENT_DURATION) * HLS_SEGMENT_DURATION

    void this.initialize()
  }

  private hls: Hls | null = null
  private originalPlaybackMode: PlaybackMode = 'transcode'
  public isSwitching = new ObservableValue(false)
  private seekGeneration = 0
  private hlsStartTime = 0
  public videoElement: HTMLVideoElement | null = null
  public audioTrackId = new ObservableValue(0)
  public playbackInfo = new ObservableValue<PlaybackInfoResponse | null>(null)
  public playbackMode = new ObservableValue<PlaybackMode>('transcode')
  public resolution = new ObservableValue<ResolutionValue | undefined>(undefined)
  public progress: ObservableValue<number>

  /**
   * Converts a 0-based stream time (from video.currentTime during HLS)
   * to the absolute file position. For direct-play, the value is returned
   * unchanged because the video element already uses absolute timestamps.
   */
  public streamTimeToAbsolute(streamTime: number): number {
    const mode = this.playbackMode.getValue()
    if (mode === 'direct-play') return streamTime
    return streamTime + this.hlsStartTime
  }

  private getAbsoluteProgress(): number {
    const video = this.videoElement
    if (!video) return this.progress.getValue()
    return this.streamTimeToAbsolute(video.currentTime)
  }

  public async [Symbol.asyncDispose]() {
    if (this.seekDebounceTimer) {
      clearTimeout(this.seekDebounceTimer)
      this.seekDebounceTimer = null
    }

    await this.teardownHlsSession()

    this.progress[Symbol.dispose]()
    this.resolution[Symbol.dispose]()
    this.playbackInfo[Symbol.dispose]()
    this.playbackMode[Symbol.dispose]()
    this.audioTrackId[Symbol.dispose]()
    this.isSwitching[Symbol.dispose]()
    if (this.hls) {
      this.hls.destroy()
      this.hls = null
    }
  }

  private async teardownHlsSession() {
    const mode = this.playbackMode.getValue()
    if (mode === 'direct-play') return

    try {
      await this.api.call({
        method: 'DELETE',
        action: '/files/:letter/:path/hls-session',
        url: {
          letter: this.file.driveLetter,
          path: this.file.path,
        },
        query: {},
      })
    } catch (error) {
      void this.logger.warning({ message: 'Failed to tear down HLS session', data: { error } })
    }
  }

  private async initialize() {
    const info = await this.fetchPlaybackInfo()
    if (info) {
      this.originalPlaybackMode = info.mode
    }
  }

  public async fetchPlaybackInfo(selectedSubtitleTrackIndex?: number): Promise<PlaybackInfoResponse | null> {
    try {
      const codecSupport = buildCodecSupportMap()
      const { result } = await this.api.call({
        method: 'POST',
        action: '/playback-info',
        body: {
          file: this.file,
          codecSupport,
          selectedAudioTrackIndex: this.audioTrackId.getValue() || undefined,
          selectedSubtitleTrackIndex,
        },
      })
      this.playbackMode.setValue(result.mode)
      this.playbackInfo.setValue(result)

      void this.logger.verbose({
        message: `Playback info received: mode=${result.mode}`,
        data: { warnings: result.warnings },
      })

      return result
    } catch (error) {
      void this.logger.error({ message: 'Failed to fetch playback info', data: { error } })
      return null
    }
  }

  /**
   * Attaches to a video element and starts playback using HLS or direct source
   */
  public attachToVideo(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement
    const info = this.playbackInfo.getValue()

    if (!info) {
      void this.logger.verbose({ message: 'No playback info yet, deferring attachment' })
      const unsub = this.playbackInfo.subscribe((newInfo) => {
        if (newInfo) {
          unsub[Symbol.dispose]()
          this.startPlayback(videoElement, newInfo)
        }
      })
      return
    }

    this.startPlayback(videoElement, info)
  }

  private startPlayback(videoElement: HTMLVideoElement, info: PlaybackInfoResponse) {
    if (this.hls) {
      this.hls.destroy()
      this.hls = null
    }

    const mode = this.playbackMode.getValue()
    if (mode === 'direct-play') {
      this.startDirectPlayback(videoElement, info)
    } else {
      this.startHlsPlayback(videoElement)
    }
  }

  private toServiceUrl(apiUrl: string): string {
    const stripped = apiUrl.startsWith('/api/') ? apiUrl.slice(4) : apiUrl
    return `${environmentOptions.serviceUrl}${stripped}`
  }

  private startDirectPlayback(videoElement: HTMLVideoElement, info: PlaybackInfoResponse) {
    void this.logger.verbose({ message: 'Starting direct playback' })
    videoElement.src = this.toServiceUrl(info.streamUrl)
    if (this.currentProgress > 0) {
      videoElement.currentTime = this.currentProgress
    }
  }

  private startHlsPlayback(videoElement: HTMLVideoElement) {
    const mode = this.playbackMode.getValue()
    const audioTrack = this.audioTrackId.getValue()
    const audioParam = audioTrack ? `&audioTrack=${encode(String(audioTrack))}` : ''
    const startTimeParam = this.hlsStartTime > 0 ? `&startTime=${encode(String(this.hlsStartTime))}` : ''
    const hlsUrl = this.toServiceUrl(
      `/api/media/files/${encodeURIComponent(this.file.driveLetter)}/${encodeURIComponent(this.file.path)}/master.m3u8?mode=${encode(mode)}${audioParam}${startTimeParam}`,
    )

    // Prefer hls.js over native HLS — many browsers (including Chromium) report
    // canPlayType('application/vnd.apple.mpegurl') as 'maybe' without full support.
    // hls.js also handles missing alternative renditions more gracefully.
    if (!Hls.isSupported()) {
      if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        void this.logger.verbose({ message: 'Using native HLS playback' })
        videoElement.src = hlsUrl
        if (this.currentProgress > 0) {
          videoElement.currentTime = this.currentProgress
        }
        return
      }
      void this.logger.error({ message: 'HLS is not supported in this browser' })
      return
    }

    void this.logger.verbose({ message: 'Starting HLS playback via hls.js' })

    this.hls = new Hls({
      xhrSetup: (xhr) => {
        xhr.withCredentials = true
      },

      startPosition: this.currentProgress > this.hlsStartTime ? this.currentProgress - this.hlsStartTime : -1,
    })

    this.hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        void this.logger.error({
          message: `HLS fatal error: ${data.type}`,
          data: { details: data.details },
        })

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          this.hls?.startLoad()
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          this.hls?.recoverMediaError()
        }
      }
    })

    const { hls } = this

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      void this.logger.verbose({ message: 'HLS manifest parsed' })

      const resolutionHeightMap: Record<string, number> = {
        '4k': 2160,
        '1080p': 1080,
        '720p': 720,
        '480p': 480,
        '360p': 360,
      }

      const sub = this.resolution.subscribe((value) => {
        if (!value) {
          hls.currentLevel = -1
          return
        }
        const targetHeight = resolutionHeightMap[value]
        if (!targetHeight) return
        const levelIndex = hls.levels.findIndex((l) => l.height === targetHeight)
        hls.currentLevel = levelIndex >= 0 ? levelIndex : -1
      })

      hls.on(Hls.Events.DESTROYING, () => sub[Symbol.dispose]())
    })

    this.hls.loadSource(hlsUrl)
    this.hls.attachMedia(videoElement)
  }

  /**
   * Switches audio track and reloads from current position
   */
  public async switchAudioTrack(trackIndex: number) {
    const previousProgress = this.getAbsoluteProgress()

    this.isSwitching.setValue(true)
    await this.teardownHlsSession()

    this.audioTrackId.setValue(trackIndex)
    this.currentProgress = previousProgress
    this.progress.setValue(previousProgress)
    this.hlsStartTime = Math.floor(previousProgress / HLS_SEGMENT_DURATION) * HLS_SEGMENT_DURATION

    await this.fetchPlaybackInfo()

    const info = this.playbackInfo.getValue()
    if (this.videoElement && info) {
      this.startPlayback(this.videoElement, info)
      this.waitForCanPlay(this.videoElement)
    } else {
      this.isSwitching.setValue(false)
    }
  }

  /**
   * Switches resolution and restarts playback. Forces transcode mode when a
   * specific resolution is requested; restores the original mode on "Auto".
   *
   * Always tears down the existing server-side HLS session to ensure the
   * old ffmpeg process is cleaned up before the new one starts.
   */
  public async switchResolution(value: ResolutionValue | undefined) {
    const targetMode = value ? 'transcode' : this.originalPlaybackMode

    const previousProgress = this.getAbsoluteProgress()

    this.isSwitching.setValue(true)
    await this.teardownHlsSession()

    this.resolution.setValue(value)
    this.currentProgress = previousProgress
    this.progress.setValue(previousProgress)
    this.hlsStartTime = Math.floor(previousProgress / HLS_SEGMENT_DURATION) * HLS_SEGMENT_DURATION
    this.playbackMode.setValue(targetMode)

    if (this.videoElement) {
      const info = this.playbackInfo.getValue()
      if (info) {
        this.startPlayback(this.videoElement, info)
        this.waitForCanPlay(this.videoElement)
      } else {
        this.isSwitching.setValue(false)
      }
    } else {
      this.isSwitching.setValue(false)
    }
  }

  private seekDebounceTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Handles a seek to a new absolute file time position. If the target is
   * before the current playlist start, tears down the current session and
   * starts a new one with server-side seeking via `-ss`. Forward seeks
   * within the current playlist are left to hls.js which can load the
   * required segments on its own.
   */
  public seekToTime(targetSeconds: number) {
    const mode = this.playbackMode.getValue()
    if (mode === 'direct-play' || this.isSwitching.getValue()) return

    const video = this.videoElement
    if (!video) return

    // Convert absolute file time to 0-based stream time for the buffer check
    const streamTime = targetSeconds - this.hlsStartTime
    if (streamTime >= 0 && this.isTimeBuffered(video, streamTime)) return

    // hls.js can handle forward seeks within the current VOD playlist
    if (targetSeconds >= this.hlsStartTime) return

    const quantizedStart = Math.floor(targetSeconds / HLS_SEGMENT_DURATION) * HLS_SEGMENT_DURATION

    if (this.seekDebounceTimer) {
      clearTimeout(this.seekDebounceTimer)
    }

    this.seekDebounceTimer = setTimeout(() => {
      this.seekDebounceTimer = null
      void this.restartHlsAtTime(targetSeconds, quantizedStart)
    }, 300)
  }

  private isTimeBuffered(video: HTMLVideoElement, time: number): boolean {
    const { buffered } = video
    for (let i = 0; i < buffered.length; i++) {
      if (time >= buffered.start(i) && time <= buffered.end(i)) {
        return true
      }
    }
    return false
  }

  private async restartHlsAtTime(targetSeconds: number, quantizedStart: number) {
    this.isSwitching.setValue(true)
    const generation = ++this.seekGeneration

    await this.teardownHlsSession()

    if (generation !== this.seekGeneration) return

    if (this.hls) {
      this.hls.destroy()
      this.hls = null
    }

    this.hlsStartTime = quantizedStart
    this.currentProgress = targetSeconds
    this.progress.setValue(targetSeconds)

    if (this.videoElement) {
      this.startHlsPlayback(this.videoElement)
      this.waitForCanPlay(this.videoElement)
    } else {
      this.isSwitching.setValue(false)
    }
  }

  private waitForCanPlay(video: HTMLVideoElement) {
    const onCanPlay = () => {
      video.removeEventListener('canplay', onCanPlay)
      this.isSwitching.setValue(false)
      // play() can reject with AbortError when navigation interrupts playback; this is benign
      void video.play().catch(() => {})
    }
    video.addEventListener('canplay', onCanPlay)
  }

  public getAudioTrackInfoFromPlaybackInfo(): AudioTrackInfo[] {
    return this.playbackInfo.getValue()?.audioTracks ?? []
  }

  public getSubtitleTrackInfoFromPlaybackInfo(): SubtitleTrackInfo[] {
    return this.playbackInfo.getValue()?.subtitleTracks ?? []
  }

  public getAudioTracks(): Array<{
    stream: FfprobeData['streams'][number]
    id: number
    codecName: string | undefined
    codecMime: string
    needsTranscoding: boolean
  }> {
    return this.ffprobe.streams
      .filter((s) => s.codec_type === 'audio')
      .map((stream) => ({
        stream,
        id: stream.index,
        codecName: stream.codec_name,
        codecMime: `${audioCodecs[stream.codec_name as keyof typeof audioCodecs] || audioCodecs.aac}`,
        needsTranscoding:
          typeof MediaSource !== 'undefined'
            ? !MediaSource.isTypeSupported(
                `audio/mp4; codecs="${audioCodecs[stream.codec_name as keyof typeof audioCodecs] || audioCodecs.aac}"`,
              )
            : true,
      }))
  }
}
