import type { ScopedLogger } from '@furystack/logging'
import { ObservableValue } from '@furystack/utils'
import {
  encode,
  type AudioTrackInfo,
  type FfprobeData,
  type PiRatFile,
  type PlaybackInfoResponse,
  type PlaybackMode,
  type SubtitleTrackInfo,
} from 'common'
import type Hls from 'hls.js'
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

const loadHls = async () => {
  const mod = await import('hls.js')
  return mod.default
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

    void this.initialize()
  }

  private hls: Hls | null = null
  public videoElement: HTMLVideoElement | null = null
  public audioTrackId = new ObservableValue(0)
  public playbackInfo = new ObservableValue<PlaybackInfoResponse | null>(null)
  public playbackMode = new ObservableValue<PlaybackMode>('transcode')
  public resolution = new ObservableValue<'4k' | '1080p' | '720p' | '480p' | '360p' | undefined>(undefined)
  public progress: ObservableValue<number>

  public async [Symbol.asyncDispose]() {
    await this.teardownHlsSession()

    this.progress[Symbol.dispose]()
    this.resolution[Symbol.dispose]()
    this.playbackInfo[Symbol.dispose]()
    this.playbackMode[Symbol.dispose]()
    this.audioTrackId[Symbol.dispose]()
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
        query: {
          mode,
          audioTrack: this.audioTrackId.getValue(),
          resolution: this.resolution.getValue(),
        },
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
      this.playbackInfo.setValue(result)
      this.playbackMode.setValue(result.mode)

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

    if (info.mode === 'direct-play') {
      this.startDirectPlayback(videoElement, info)
    } else {
      void this.startHlsPlayback(videoElement)
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

  private async startHlsPlayback(videoElement: HTMLVideoElement) {
    const mode = this.playbackMode.getValue()
    const hlsUrl = this.toServiceUrl(
      `/api/media/files/${encodeURIComponent(this.file.driveLetter)}/${encodeURIComponent(this.file.path)}/master.m3u8?mode=${encode(mode)}`,
    )

    const HlsModule = await loadHls()

    // Prefer hls.js over native HLS — many browsers (including Chromium) report
    // canPlayType('application/vnd.apple.mpegurl') as 'maybe' without full support.
    // hls.js also handles missing alternative renditions more gracefully.
    if (!HlsModule.isSupported()) {
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

    this.hls = new HlsModule({
      xhrSetup: (xhr) => {
        xhr.withCredentials = true
      },
      startPosition: this.currentProgress > 0 ? this.currentProgress : -1,
    })

    this.hls.on(HlsModule.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        void this.logger.error({
          message: `HLS fatal error: ${data.type}`,
          data: { details: data.details },
        })

        if (data.type === HlsModule.ErrorTypes.NETWORK_ERROR) {
          this.hls?.startLoad()
        } else if (data.type === HlsModule.ErrorTypes.MEDIA_ERROR) {
          this.hls?.recoverMediaError()
        }
      }
    })

    const { hls } = this

    hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
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

      hls.on(HlsModule.Events.DESTROYING, () => sub[Symbol.dispose]())
    })

    this.hls.loadSource(hlsUrl)
    this.hls.attachMedia(videoElement)
  }

  /**
   * Switches audio track and reloads from current position
   */
  public async switchAudioTrack(trackIndex: number) {
    const previousProgress = this.videoElement?.currentTime ?? this.progress.getValue()

    await this.teardownHlsSession()

    this.audioTrackId.setValue(trackIndex)
    this.currentProgress = previousProgress

    await this.fetchPlaybackInfo()

    const info = this.playbackInfo.getValue()
    if (this.videoElement && info) {
      this.startPlayback(this.videoElement, info)
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
