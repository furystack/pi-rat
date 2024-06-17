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
  constructor(
    private readonly file: PiRatFile,
    private readonly ffprobe: FfprobeData,
    private readonly api: MediaApiClient,
    private currentProgress: number,
  ) {
    this.progress = new ObservableValue(this.currentProgress)
    this.progress.subscribe(this.onProgressChange)

    this.MediaSource = new MediaSource()
    this.url = URL.createObjectURL(this.MediaSource)

    this.MediaSource.addEventListener('sourceopen', () => {
      console.log('MediaSource opened')
      this.MediaSource.duration = this.ffprobe.format.duration || 0
    })

    this.MediaSource.addEventListener('sourceclose', () => {
      console.log('MediaSource closed')
    })

    this.MediaSource.addEventListener('sourceended', () => {
      console.log('MediaSource ended')
    })

    this.chunkLength = 2

    this.loadChunkForProgress(this.currentProgress)
  }

  public readonly MediaSource: MediaSource
  public readonly url: string
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

  private bufferZones: Array<[number, number]> = []
  private gapsInBuffers: Array<[number, number]> = []

  private getActiveSourceBuffer = () => {
    const existing = this.MediaSource.activeSourceBuffers[0]
    if (existing) {
      return existing
    }
    console.log('Creating new source buffer')
    const newSourceBuffer = this.MediaSource.addSourceBuffer(this.getMimeType())
    return newSourceBuffer
  }

  private updateBufferZones = () => {
    const newSourceBuffer = this.MediaSource.activeSourceBuffers[0]
    this.bufferZones = newSourceBuffer.buffered.length
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
      : []

    this.gapsInBuffers = this.bufferZones.reduce(
      (acc, [_start, end], i) => {
        const nextStart = this.bufferZones[i + 1]?.[0] || end
        if (nextStart > end) {
          acc.push([end, nextStart])
        }
        return acc
      },
      [] as Array<[number, number]>,
    )
    // console.log('Buffer updated:', {
    //   bufferZones: this.bufferZones,
    //   gapsInBuffers: this.gapsInBuffers,
    //   mediaSourceState: this.MediaSource.readyState,
    // })
  }

  public async loadChunkForProgress(progress: number) {
    const from = this.getSegmentStartForProgress(progress)
    const to = from + this.chunkLength
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
      const sourceBuffer = this.getActiveSourceBuffer()

      await new Promise((resolve, reject) => {
        const onUpdateEnd = resolve
        const onError = reject
        sourceBuffer.addEventListener('updateend', onUpdateEnd)
        sourceBuffer.addEventListener('error', onError)
        if (sourceBuffer.updating) {
          console.warn('Source buffer is updating, aborting')
          sourceBuffer.abort()
        }
        sourceBuffer.timestampOffset = from
        sourceBuffer.appendBuffer(arrayBuffer)
      })

      const end = new Date().getTime()
      this.lastLoadTime = (end - start) / 1000
    } catch (error) {
      console.error('Chunk loading error', error)
    } finally {
      this.loadLock.release()
    }
  }

  public progress: ObservableValue<number>

  public getSegmentStartForProgress(progress: number) {
    return Math.floor(progress / this.chunkLength) * this.chunkLength
  }

  private onProgressChange = (progress: number) => {
    this.updateBufferZones()
    const sb = this.getActiveSourceBuffer()
    if (!sb.buffered.length) {
      console.warn('No buffered data, loading a chunk...', { progress })
      this.loadChunkForProgress(progress)
      return
    }

    const isInGap = this.gapsInBuffers.some(([start, end]) => progress >= start && progress <= end)
    if (isInGap) {
      if (this.loadLock.getPermits()) {
        console.warn('Progress inside a buffer gap', { progress, lastLoadTime: this.lastLoadTime })
        sb.abort()
        this.loadChunkForProgress(progress)
      }
    }

    const minDesiredGapDistance = this.chunkLength - 1
    const isGapApproaching = this.gapsInBuffers.find(
      ([start, end]) => progress >= start - minDesiredGapDistance && progress <= end,
    )

    if (isGapApproaching) {
      if (this.loadLock.getPermits()) {
        console.warn('Gap approaching, write queue clear, loading a chunk...', {
          progress,
          lastLoadTime: this.lastLoadTime,
          nextGap: isGapApproaching,
        })
        this.loadChunkForProgress(isGapApproaching[0])
      }
    }
  }

  private readonly chunkLength: number

  public getAudioTracks() {
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
