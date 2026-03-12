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

  public isSwitching = new ObservableValue(false)
  private seekGeneration = 0
  private hlsStartTime = 0
  private pendingCanPlayCleanup: (() => void) | null = null
  public videoElement: HTMLVideoElement | null = null
  public audioTrackId = new ObservableValue(0)
  public playbackInfo = new ObservableValue<PlaybackInfoResponse | null>(null)
  public playbackMode = new ObservableValue<PlaybackMode>('transcode')
  public progress: ObservableValue<number>

  public isPlaying = new ObservableValue(false)
  public duration = new ObservableValue(0)
  public volume = new ObservableValue(1)
  public isMuted = new ObservableValue(false)
  public isFullscreen = new ObservableValue(false)
  public playbackRate = new ObservableValue(1)
  public buffered = new ObservableValue<TimeRanges | null>(null)
  public activeSubtitleTrack = new ObservableValue<number | null>(null)

  private videoEventCleanup: Disposable | null = null

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

    if (this.pendingCanPlayCleanup) {
      this.pendingCanPlayCleanup()
    }

    this.videoEventCleanup?.[Symbol.dispose]()
    this.videoEventCleanup = null

    await this.teardownHlsSession()

    this.progress[Symbol.dispose]()
    this.playbackInfo[Symbol.dispose]()
    this.playbackMode[Symbol.dispose]()
    this.audioTrackId[Symbol.dispose]()
    this.isSwitching[Symbol.dispose]()
    this.isPlaying[Symbol.dispose]()
    this.duration[Symbol.dispose]()
    this.volume[Symbol.dispose]()
    this.isMuted[Symbol.dispose]()
    this.isFullscreen[Symbol.dispose]()
    this.playbackRate[Symbol.dispose]()
    this.buffered[Symbol.dispose]()
    this.activeSubtitleTrack[Symbol.dispose]()
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
    await this.fetchPlaybackInfo()
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
   * Attaches to a video element, binds event listeners for observable state,
   * and starts playback using native HLS or direct source.
   */
  public attachToVideo(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement
    this.bindVideoEvents(videoElement)

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

  private bindVideoEvents(video: HTMLVideoElement) {
    const onPlay = () => this.isPlaying.setValue(true)
    const onPause = () => this.isPlaying.setValue(false)
    const onVolumeChange = () => {
      this.volume.setValue(video.volume)
      this.isMuted.setValue(video.muted)
    }
    const updateDuration = () => {
      const playbackDuration = this.playbackInfo.getValue()?.duration
      if (playbackDuration && playbackDuration > 0) {
        this.duration.setValue(playbackDuration)
      } else if (video.duration && isFinite(video.duration)) {
        this.duration.setValue(video.duration)
      }
    }
    const onDurationChange = updateDuration
    const onLoadedMetadata = updateDuration
    const onRateChange = () => this.playbackRate.setValue(video.playbackRate)
    const onProgress = () => this.buffered.setValue(video.buffered)
    const onTimeUpdate = () => {
      if (this.isSwitching.getValue()) return
      this.progress.setValue(this.streamTimeToAbsolute(video.currentTime) || 0)
    }
    const onSeeking = () => {
      this.seekToTime(this.streamTimeToAbsolute(video.currentTime))
    }
    const onFullscreenChange = () => {
      this.isFullscreen.setValue(!!document.fullscreenElement)
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('volumechange', onVolumeChange)
    video.addEventListener('durationchange', onDurationChange)
    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('ratechange', onRateChange)
    video.addEventListener('progress', onProgress)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('seeking', onSeeking)
    document.addEventListener('fullscreenchange', onFullscreenChange)

    const playbackInfoDuration = this.playbackInfo.getValue()?.duration
    if (playbackInfoDuration && playbackInfoDuration > 0) {
      this.duration.setValue(playbackInfoDuration)
    }

    this.videoEventCleanup = {
      [Symbol.dispose]: () => {
        video.removeEventListener('play', onPlay)
        video.removeEventListener('pause', onPause)
        video.removeEventListener('volumechange', onVolumeChange)
        video.removeEventListener('durationchange', onDurationChange)
        video.removeEventListener('loadedmetadata', onLoadedMetadata)
        video.removeEventListener('ratechange', onRateChange)
        video.removeEventListener('progress', onProgress)
        video.removeEventListener('timeupdate', onTimeUpdate)
        video.removeEventListener('seeking', onSeeking)
        document.removeEventListener('fullscreenchange', onFullscreenChange)
      },
    }
  }

  public togglePlay() {
    const video = this.videoElement
    if (!video) return
    if (video.paused) {
      void video.play().catch(() => {})
    } else {
      video.pause()
    }
  }

  public setVolume(value: number) {
    if (this.videoElement) {
      this.videoElement.volume = Math.max(0, Math.min(1, value))
    }
  }

  public setMuted(muted: boolean) {
    if (this.videoElement) {
      this.videoElement.muted = muted
    }
  }

  public setPlaybackRate(rate: number) {
    if (this.videoElement) {
      this.videoElement.playbackRate = rate
    }
  }

  public toggleFullscreen(container: HTMLElement) {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void container.requestFullscreen()
    }
  }

  public togglePip() {
    const video = this.videoElement
    if (!video) return
    if (document.pictureInPictureElement) {
      void document.exitPictureInPicture()
    } else {
      void video.requestPictureInPicture()
    }
  }

  private startPlayback(videoElement: HTMLVideoElement, info: PlaybackInfoResponse) {
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

    void this.logger.verbose({ message: 'Starting native HLS playback' })
    videoElement.src = hlsUrl
    if (this.currentProgress > this.hlsStartTime) {
      videoElement.currentTime = this.currentProgress - this.hlsStartTime
    }
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

  private seekDebounceTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Handles a seek to a new absolute file time position. For forward seeks
   * within the current playlist, sets video.currentTime directly. If the
   * target is before the current playlist start, tears down the current
   * session and starts a new one with server-side seeking via `-ss`.
   */
  public seekToTime(targetSeconds: number) {
    const mode = this.playbackMode.getValue()
    if (mode === 'direct-play' || this.isSwitching.getValue()) return

    const video = this.videoElement
    if (!video) return

    const streamTime = targetSeconds - this.hlsStartTime
    if (streamTime >= 0 && this.isTimeBuffered(video, streamTime)) return

    if (targetSeconds >= this.hlsStartTime) {
      video.currentTime = targetSeconds - this.hlsStartTime
      return
    }

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

    try {
      await this.teardownHlsSession()

      if (generation !== this.seekGeneration) return

      this.hlsStartTime = quantizedStart
      this.currentProgress = targetSeconds
      this.progress.setValue(targetSeconds)

      if (this.videoElement) {
        this.startHlsPlayback(this.videoElement)
        this.waitForCanPlay(this.videoElement)
      } else {
        this.isSwitching.setValue(false)
      }
    } catch {
      if (generation === this.seekGeneration) {
        this.isSwitching.setValue(false)
      }
    }
  }

  private waitForCanPlay(video: HTMLVideoElement) {
    if (this.pendingCanPlayCleanup) {
      this.pendingCanPlayCleanup()
    }

    const onCanPlay = () => {
      video.removeEventListener('canplay', onCanPlay)
      this.pendingCanPlayCleanup = null
      this.isSwitching.setValue(false)
      // play() can reject with AbortError when navigation interrupts playback; this is benign
      void video.play().catch(() => {})
    }
    video.addEventListener('canplay', onCanPlay)
    this.pendingCanPlayCleanup = () => {
      video.removeEventListener('canplay', onCanPlay)
      this.pendingCanPlayCleanup = null
    }
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
