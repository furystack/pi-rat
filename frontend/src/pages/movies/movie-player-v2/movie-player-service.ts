import type { ScopedLogger } from '@furystack/logging'
import { ObservableValue } from '@furystack/utils'
import type {
  AudioTrackInfo,
  FfprobeData,
  PiRatFile,
  PlaybackInfoResponse,
  PlaybackMode,
  StreamQueryParams,
  SubtitleTrackInfo,
} from 'common'
import type Hls from 'hls.js'
import type { MediaApiClient } from '../../../services/api-clients/media-api-client.js'
import { environmentOptions } from '../../../environment-options.js'

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
  public resolution = new ObservableValue<Required<StreamQueryParams>['video']['resolution'] | undefined>(undefined)
  public progress: ObservableValue<number>

  public async [Symbol.asyncDispose]() {
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
    const hlsUrl = this.toServiceUrl(
      `/api/media/files/${encodeURIComponent(this.file.driveLetter)}/${encodeURIComponent(this.file.path)}/master.m3u8`,
    )

    if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      void this.logger.verbose({ message: 'Using native HLS playback' })
      videoElement.src = hlsUrl
      if (this.currentProgress > 0) {
        videoElement.currentTime = this.currentProgress
      }
      return
    }

    const HlsModule = await loadHls()

    if (!HlsModule.isSupported()) {
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

    this.hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
      void this.logger.verbose({ message: 'HLS manifest parsed' })
    })

    this.hls.loadSource(hlsUrl)
    this.hls.attachMedia(videoElement)
  }

  /**
   * Switches audio track and reloads from current position
   */
  public async switchAudioTrack(trackIndex: number) {
    const previousProgress = this.videoElement?.currentTime ?? this.progress.getValue()
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
