import { Cache } from '@furystack/cache'
import { getStoreManager } from '@furystack/core'
import { Injectable, type Injector } from '@furystack/inject'
import { Config, Drive, type PiRatFile, type StreamQueryParams } from 'common'
import { join } from 'path'
import type { MoviesConfig } from '../../../../common/src/models/config/movies-config.js'
import { FfprobeService } from '../../ffprobe-service.js'

@Injectable({
  lifetime: 'singleton',
})
export class StreamFileActionCaches {
  declare public injector: Injector

  public driveCache = new Cache({
    load: async (key: string) => {
      const driveStore = getStoreManager(this.injector).getStoreFor(Drive, 'letter')
      const drive = await driveStore.get(key)
      return drive
    },
  })

  public moviesConfigCache = new Cache({
    load: async () => {
      const moviesStore = getStoreManager(this.injector).getStoreFor(Config, 'id')
      const moviesConfig = await moviesStore.get('MOVIES_CONFIG')

      if (!moviesConfig) {
        return {
          id: 'MOVIES_CONFIG',
          value: {
            autoExtractSubtitles: false,
            fullSyncOnStartup: false,
            preset: 'ultrafast',
            id: 'MOVIES_CONFIG',
            watchFiles: 'all',
          },
        } as MoviesConfig
      }

      return moviesConfig as MoviesConfig
    },
  })

  public ffMpegArgsCache = new Cache({
    capacity: 100,
    load: async ({
      injector,
      queryParams,
      file,
    }: {
      injector: Injector
      queryParams: StreamQueryParams
      file: PiRatFile
    }) => {
      const { audio, video, from, to } = queryParams

      const [drive, config, ffprobe] = await Promise.all([
        this.driveCache.get(file.driveLetter),
        this.moviesConfigCache.get(),
        injector.getInstance(FfprobeService).getFfprobeForPiratFile(file),
      ])

      if (!drive) {
        throw new Error(`Drive ${file.driveLetter} not found`)
      }

      const fullPath = join(drive.physicalPath, file.path)

      const audioStreams = ffprobe.streams.filter((stream) => stream.codec_type === 'audio')
      const audioStream = audioStreams.find((track) => track.index === audio?.trackId) || audioStreams[0]

      // Build ffmpeg args
      const ffmpegArgs: string[] = []

      if (typeof from === 'number') {
        ffmpegArgs.push('-ss', String(from))
      }

      ffmpegArgs.push('-i', fullPath, '-f', 'mp4', '-movflags', 'empty_moov+frag_keyframe+faststart+default_base_moof')

      if (typeof to === 'number' && typeof from === 'number') {
        ffmpegArgs.push('-t', String(Math.max(to - from, 1)))
      }

      const audioStreamIndex = Math.max(
        0,
        audioStreams.findIndex((stream) => stream === audioStream),
      )
      ffmpegArgs.push('-map', `0:a:${audioStreamIndex}`)

      if (audio?.audioCodec) {
        ffmpegArgs.push('-c:a', audio.audioCodec)
      } else {
        ffmpegArgs.push('-c:a', 'aac')
        ffmpegArgs.push('-b:a', '128k')
      }
      if (audio?.bitrate) {
        ffmpegArgs.push('-b:a', String(audio.bitrate))
      }
      if (audio?.mixdown) {
        ffmpegArgs.push('-ac', '2')
      }

      const videoStreamIndex = 0
      ffmpegArgs.push('-map', `0:v:${videoStreamIndex}`)
      if (video?.codec) {
        ffmpegArgs.push('-c:v', video.codec)
      } else {
        ffmpegArgs.push('-c:v', 'libx264')
      }
      ffmpegArgs.push('-preset', config.value.preset || 'ultrafast')

      if (video?.resolution) {
        switch (video.resolution) {
          case '4k':
            ffmpegArgs.push('-s', '3840x2160')
            break
          case '1080p':
            ffmpegArgs.push('-s', '1920x1080')
            break
          case '720p':
            ffmpegArgs.push('-s', '1280x720')
            break
          case '480p':
            ffmpegArgs.push('-s', '854x480')
            break
          case '360p':
            ffmpegArgs.push('-s', '640x360')
            break
          default:
            break
        }
      }

      ffmpegArgs.push('pipe:1') // Output to stdout

      return ffmpegArgs
    },
  })

  public init() {
    getStoreManager(this.injector)
      .getStoreFor(Config, 'id')
      .subscribe('onEntityUpdated', ({ id }) => {
        if (id === 'MOVIES_CONFIG') {
          this.moviesConfigCache.setObsolete()
        }
      })
  }
}
