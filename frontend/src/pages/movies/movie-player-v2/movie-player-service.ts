import { ObservableValue, type Disposable } from '@furystack/utils'
import type { PiRatFile } from 'common'
import type { FfprobeData } from 'fluent-ffmpeg'
import { Lock } from 'semaphore-async-await'
import type { MediaApiClient } from '../../../services/api-clients/media-api-client.js'

// MIME Support list: https://cconcolato.github.io/media-mime-support/#video/mp4;%20codecs=%22hev1.2.4.L120.B0%22

export const videoCodecs = {
  h264: 'avc1.42E01E',
  hevc: 'hev1.2.4.L120.B0',
  vp9: 'vp09.00.10.08',
}

export const audioCodecs = {
  aac: 'mp4a.40.2',
  ac3: 'ac-3',
  eac3: 'mp4a.40.5',
  opus: 'opus',
  dts: 'dts+',
}

export class MoviePlayerService implements Disposable {
  public readonly MediaSource = new MediaSource()
  public readonly url = URL.createObjectURL(this.MediaSource)

  private loadLock = new Lock()

  public audioTrackId = new ObservableValue(0)

  public async dispose() {
    this.progress.dispose()
    this.MediaSource.endOfStream()
    ;[...this.MediaSource.sourceBuffers].forEach((sb) => {
      try {
        this.MediaSource.removeSourceBuffer(sb)
      } catch (e) {
        console.error('Error disposing MediaSource Buffer', e)
      }
    })
  }

  private lastLoadTime = Infinity

  private getActiveSourceBuffer = () =>
    this.MediaSource.activeSourceBuffers[0] || this.MediaSource.addSourceBuffer(this.getMimeType())

  public async loadChunk(
    from: number,
    to: number = from + this.chunkLength,
    sourceBuffer = this.getActiveSourceBuffer(),
  ) {
    console.log(`Starting stream from ${from} to ${to}`)
    try {
      await this.loadLock.acquire()

      const start = new Date().getTime()

      const audio = this.getAudioTracks()[this.audioTrackId.getValue()]

      const video = this.getVideoTrack()

      const { response } = await this.api.call({
        method: 'GET',
        action: '/files/:letter/:path/stream',
        url: {
          letter: encodeURIComponent(this.file.driveLetter),
          path: encodeURIComponent(this.file.path),
        },
        query: {
          from,
          to,
          audio: {
            trackId: this.audioTrackId.getValue(),
            ...(audio?.needsTranscoding
              ? {
                  audioCodec: 'aac',
                  bitrate: 96,
                }
              : {}),
            mixdown: true,
          },
          ...(video.needsTranscoding
            ? {
                video: {
                  codec: 'libx264',
                },
              }
            : {}),
        },
        responseParser: async (r) => {
          return { response: r, result: null as any }
        },
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      sourceBuffer.timestampOffset = from
      sourceBuffer.appendBuffer(arrayBuffer)
      const end = new Date().getTime()
      this.lastLoadTime = (end - start) / 1000
    } catch (error) {
      console.error('Chunk loading error', error)
    } finally {
      this.loadLock.release()
    }
  }

  public progress = new ObservableValue(-1)

  public progressUpdateSubscription = this.progress.subscribe((progress) => {
    const sb = this.getActiveSourceBuffer()
    if (!sb || sb.updating) {
      return
    }

    if (!sb.buffered.length) {
      this.loadChunk(Math.floor(progress / this.chunkLength) * this.chunkLength)
      return
    }

    const bufferZones = [
      ...(sb.buffered.start(0) > 0 ? [[0, 0] as const] : []),
      ...new Array(sb.buffered.length).fill(0).map((_, i) => [sb.buffered.start(i), sb.buffered.end(i)]),
      ...(!this.ffprobe.format.duration || sb.buffered.end(sb.buffered.length - 1) < this.ffprobe.format.duration - 1
        ? [[this.ffprobe.format.duration, this.ffprobe.format.duration] as [number, number]]
        : []),
    ]

    const gapsInBuffers = bufferZones.reduce(
      (acc, [_start, end], i) => {
        const nextStart = bufferZones[i + 1]?.[0] || end
        if (nextStart > end) {
          acc.push([end, nextStart])
        }
        return acc
      },
      [] as Array<[number, number]>,
    )

    const isInGap = gapsInBuffers.some(([start, end]) => progress >= start && progress <= end)
    if (isInGap) {
      if (this.loadLock.getPermits()) {
        console.warn('Gap detected, seeking to buffer end', { progress, gapsInBuffers, bufferZones })
        sb.abort()
        this.loadChunk(Math.floor(progress / this.chunkLength) * this.chunkLength)
      }
    }

    const minDesiredGapDistance = this.chunkLength - 1
    const isGapApproaching = gapsInBuffers.find(
      ([start, end]) => progress >= start - minDesiredGapDistance && progress <= end,
    )

    if (isGapApproaching) {
      if (this.loadLock.getPermits()) {
        console.warn('Gap approaching, write queue clear, loading a chunk...', {
          progress,
          gapsInBuffers,
          bufferZones,
          lastLoadTime: this.lastLoadTime,
        })
        this.loadChunk(isGapApproaching[0])
      }
    }
  })

  public readonly chunkLength = 10

  public getAudioTracks() {
    return this.ffprobe.streams
      .filter((s) => s.codec_type === 'audio')
      .map((s) => ({
        id: s.index,
        codecName: s.codec_name,
        codecMime: `${audioCodecs[s.codec_name as keyof typeof audioCodecs] || audioCodecs.aac}`,
        needsTranscoding: !MediaSource.isTypeSupported(
          `audio/mp4; codecs="${audioCodecs[s.codec_name as keyof typeof audioCodecs] || audioCodecs.aac}"`,
        ),
      }))
  }

  private getVideoTrack() {
    const codecName = this.ffprobe.streams.find((s) => s.codec_type === 'video')?.codec_name || 'unknown'
    return {
      codecName,
      codecMime: `${videoCodecs[codecName as keyof typeof videoCodecs] || videoCodecs.h264}`,
      needsTranscoding: !MediaSource.isTypeSupported(
        `video/mp4; codecs="${videoCodecs[codecName as keyof typeof videoCodecs] || videoCodecs.h264}"`,
      ),
    }
  }

  private getMimeType() {
    const audio = this.getAudioTracks()[this.audioTrackId.getValue()]
    const video = this.getVideoTrack()
    const videoCodecMime = video.needsTranscoding ? videoCodecs.h264 : video.codecMime
    const audioCodecMime = audio.needsTranscoding ? audioCodecs.aac : audio.codecMime
    return `video/mp4; codecs="${videoCodecMime}, ${audioCodecMime}"`
  }

  constructor(
    private readonly file: PiRatFile,
    private readonly ffprobe: FfprobeData,
    private readonly api: MediaApiClient,
  ) {}
}
