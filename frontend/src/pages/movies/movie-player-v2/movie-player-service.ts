import { ObservableValue, type Disposable } from '@furystack/utils'
import type { PiRatFile } from 'common'
import type { FfprobeData } from 'fluent-ffmpeg'
import { Lock } from 'semaphore-async-await'
import type { MediaApiClient } from '../../../services/api-clients/media-api-client.js'

export class MoviePlayerService implements Disposable {
  public readonly MediaSource = new MediaSource()
  public readonly url = URL.createObjectURL(this.MediaSource)

  private loadLock = new Lock()

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

  public async loadChunk(
    from: number,
    to: number = from + this.chunkLength,
    sourceBuffer = this.MediaSource.activeSourceBuffers[0] ||
      this.MediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'),
  ) {
    try {
      await this.loadLock.acquire()

      const start = new Date().getTime()
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
            trackId: 0,
            audioCodec: 'aac',
            mixdown: true,
            bitrate: 96,
          },
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
    const sb = this.MediaSource.activeSourceBuffers[0]
    if (!sb || sb.updating) {
      return
    }

    const bufferZones = [
      [0, 0] as const,
      ...new Array(sb.buffered.length).fill(0).map((_, i) => [sb.buffered.start(i), sb.buffered.end(i)]),
      [this.ffprobe.format.duration, this.ffprobe.format.duration] as [number, number],
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
        console.warn('Gap detected, seeking to buffer end', { progress, gapsInBuffers })
        sb.abort()
        this.loadChunk(progress - 1)
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
          lastLoadTime: this.lastLoadTime,
        })
        this.loadChunk(isGapApproaching[0])
      }
    }
  })

  private chunkLength = 10

  constructor(
    private readonly file: PiRatFile,
    private readonly ffprobe: FfprobeData,
    private readonly api: MediaApiClient,
  ) {
    console.log(this.ffprobe)
  }
}
