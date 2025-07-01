import type { ScopedLogger } from '@furystack/logging'
import { ObservableValue } from '@furystack/utils'
import type { FfprobeData, PiRatFile } from 'common'
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

export class MoviePlayerService implements AsyncDisposable {
  constructor(
    private readonly file: PiRatFile,
    private readonly ffprobe: FfprobeData,
    private readonly api: MediaApiClient,
    private currentProgress: number,
    private readonly logger: ScopedLogger,
  ) {
    this.progress = new ObservableValue(this.currentProgress)
    this.progress.subscribe(this.onProgressChange)

    this.MediaSource = new MediaSource()
    this.url = URL.createObjectURL(this.MediaSource)

    this.MediaSource.addEventListener('sourceopen', () => {
      void this.logger.verbose({ message: 'MediaSource opened' })
      this.MediaSource.duration = this.ffprobe.format.duration || 0
    })

    this.MediaSource.addEventListener('sourceclose', () => {
      void this.logger.verbose({ message: 'MediaSource closed' })
    })

    this.MediaSource.addEventListener('sourceended', () => {
      void this.logger.verbose({ message: 'MediaSource ended' })
    })

    this.chunkLength = 10

    void this.loadChunkForProgress(this.currentProgress)
  }

  public readonly MediaSource: MediaSource
  public readonly url: string
  private loadLock = new Lock()
  public audioTrackId = new ObservableValue(0)
  public async [Symbol.asyncDispose]() {
    this.progress[Symbol.dispose]()
    this.bufferZoneChangeSubscription[Symbol.dispose]()
    this.bufferZones[Symbol.dispose]()
    this.gapsInBuffersChangeSubscription[Symbol.dispose]()
    this.gapsInBuffers[Symbol.dispose]()
    this.lastLoadTime[Symbol.dispose]()
    this.MediaSource.endOfStream()
    ;[...this.MediaSource.sourceBuffers].forEach((sb) => {
      try {
        this.MediaSource.removeSourceBuffer(sb)
      } catch (error) {
        void this.logger.error({ message: 'Error disposing MediaSource Buffer', data: { error } })
      }
    })
  }

  private lastLoadTime = new ObservableValue(Infinity)

  private bufferZones = new ObservableValue<Array<[number, number]>>([], {
    compare: (a, b) => {
      return JSON.stringify(a) !== JSON.stringify(b)
    },
  })
  private gapsInBuffers = new ObservableValue<Array<[number, number]>>([], {
    compare: (a, b) => {
      return JSON.stringify(a) !== JSON.stringify(b)
    },
  })

  private bufferZoneChangeSubscription = this.bufferZones.subscribe((next) => {
    void this.logger.verbose({ message: 'Buffer zones changed', data: { next } })
  })

  private gapsInBuffersChangeSubscription = this.gapsInBuffers.subscribe((next) => {
    void this.logger.verbose({ message: 'Gaps in buffers changed', data: { next } })
  })

  private getActiveSourceBuffer = async () => {
    const existing = this.MediaSource.activeSourceBuffers[0]
    if (existing) {
      return existing
    }

    if (this.MediaSource.readyState !== 'open') {
      void this.logger.verbose({
        message: `MediaSource is not open but ${this.MediaSource.readyState}, awaiting opening state`,
      })
      await new Promise<void>((resolve) => {
        this.MediaSource.addEventListener(
          'sourceopen',
          () => {
            resolve()
          },
          { once: true },
        )
      })
    }

    void this.logger.verbose({ message: 'Creating new source buffer' })
    const newSourceBuffer = this.MediaSource.addSourceBuffer(this.getMimeType())
    newSourceBuffer.mode = 'segments'
    return newSourceBuffer
  }

  private updateBufferZones = () => {
    const newSourceBuffer = this.MediaSource.activeSourceBuffers[0]
    this.bufferZones.setValue(
      newSourceBuffer.buffered.length
        ? [
            ...(newSourceBuffer.buffered.start(0) > 0 ? [[0, 0] as [number, number]] : []),
            ...new Array(newSourceBuffer.buffered.length)
              .fill(0)
              .map((_, i) => [newSourceBuffer.buffered.start(i), newSourceBuffer.buffered.end(i)] as [number, number]),
            ...(!this.ffprobe.format.duration ||
            newSourceBuffer.buffered.end(newSourceBuffer.buffered.length - 1) < this.ffprobe.format.duration - 1
              ? [[this.ffprobe.format.duration, this.ffprobe.format.duration] as [number, number]]
              : []),
          ]
        : [],
    )

    this.gapsInBuffers.setValue(
      this.bufferZones.getValue().reduce(
        (acc, [_start, end], i) => {
          const nextStart = this.bufferZones.getValue()[i + 1]?.[0] || end
          if (nextStart > end) {
            acc.push([end, nextStart])
          }
          return acc
        },
        [] as Array<[number, number]>,
      ),
    )
  }

  public async loadChunkForProgress(progress: number) {
    try {
      await this.loadLock.acquire()
      const from = this.getSegmentStartForProgress(progress)
      const to = from + this.chunkLength
      void this.logger.verbose({ message: `Loading chunk from ${from} to ${to}` })

      const sourceBuffer = await this.getActiveSourceBuffer()
      const start = new Date().getTime()
      const audioTracks = this.getAudioTracks()

      const audio = audioTracks.find((track) => track.id === this.audioTrackId.getValue()) || audioTracks[0]

      const video = this.getVideoTrack()

      const { response } = await this.api.call({
        method: 'GET',
        action: '/files/:letter/:path/stream',
        url: {
          letter: this.file.driveLetter,
          path: this.file.path,
        },
        query: {
          from,
          to,
          audio: {
            trackId: audio.id,
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

      if (sourceBuffer.updating) {
        void this.logger.verbose({ message: 'SourceBuffer is updating, waiting for it to finish' })
        await new Promise<void>((resolve) => {
          sourceBuffer.addEventListener(
            'updateend',
            () => {
              resolve()
            },
            { once: true },
          )
        })
      }

      sourceBuffer.timestampOffset = from
      sourceBuffer.appendBuffer(arrayBuffer)

      const end = new Date().getTime()
      this.lastLoadTime.setValue((end - start) / 1000)
      void this.logger.verbose({ message: `Loading ${from}-${to} loading finished` })
    } catch (error) {
      void this.logger.error({ message: 'Chunk loading error', data: { error } })
    } finally {
      this.loadLock.release()
    }
  }

  public progress: ObservableValue<number>

  public getSegmentStartForProgress(progress: number) {
    return Math.floor(progress / this.chunkLength) * this.chunkLength
  }

  public onProgressChange = async (progress: number) => {
    this.updateBufferZones()
    const sb = await this.getActiveSourceBuffer()
    if (!sb.buffered.length) {
      void this.logger.information({ message: 'No buffered data, loading a chunk...', data: { progress } })
      await this.loadChunkForProgress(progress)
      return
    }

    const isInGap = this.gapsInBuffers.getValue().some(([start, end]) => progress >= start && progress <= end)
    if (isInGap) {
      if (this.loadLock.getPermits()) {
        void this.logger.information({
          message: 'Progress inside a buffer gap',
        })
        await this.loadChunkForProgress(progress)
      }
    }

    const minDesiredGapDistance = this.chunkLength
    const isGapApproaching = this.gapsInBuffers
      .getValue()
      .find(([start, end]) => progress >= start - minDesiredGapDistance && progress <= end)

    if (isGapApproaching) {
      if (this.loadLock.getPermits()) {
        void this.logger.information({
          message: 'Gap approaching, write queue clear, loading a chunk...',
        })
        await this.loadChunkForProgress(isGapApproaching[0])
      }
    }
  }

  private readonly chunkLength: number

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
        needsTranscoding: !MediaSource.isTypeSupported(
          `audio/mp4; codecs="${audioCodecs[stream.codec_name as keyof typeof audioCodecs] || audioCodecs.aac}"`,
        ),
      }))
  }

  private getVideoTrack() {
    const stream = this.ffprobe.streams.find((s) => s.codec_type === 'video')
    const codecName = stream?.codec_name || 'unknown'
    return {
      stream,
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
}
