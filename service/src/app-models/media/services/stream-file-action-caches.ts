import { Cache } from '@furystack/cache'
import { useSystemIdentityContext } from '@furystack/core'
import { Injected, Injectable, type Injector } from '@furystack/inject'
import { getDataSetFor } from '@furystack/repository'
import { Config, Drive, type MoviesConfig, type PiRatFile, type StreamQueryParams } from 'common'
import { join } from 'path'
import { FfprobeService } from '../../../ffprobe-service.js'

@Injectable({
  lifetime: 'singleton',
})
export class StreamFileActionCaches {
  declare public injector: Injector

  @Injected((injector) => useSystemIdentityContext({ injector, username: 'stream-cache' }))
  declare private systemInjector: Injector

  public driveCache = new Cache({
    load: async (key: string) => {
      const driveDataSet = getDataSetFor(this.injector, Drive, 'letter')
      const drive = await driveDataSet.get(this.systemInjector, key)
      return drive
    },
  })

  public moviesConfigCache = new Cache({
    load: async (): Promise<MoviesConfig> => {
      const configDataSet = getDataSetFor(this.injector, Config, 'id')
      const moviesConfig = await configDataSet.get(this.systemInjector, 'MOVIES_CONFIG')

      if (!moviesConfig) {
        return {
          id: 'MOVIES_CONFIG',
          value: {
            autoExtractSubtitles: false,
            fullSyncOnStartup: false,
            preset: 'ultrafast',
            watchFiles: 'all',
          },
        }
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
      const { audio, video, from, to, mode } = queryParams

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

      const isRemux = mode === 'remux'
      const isDirectStream = mode === 'direct-stream'
      const copyVideo = isRemux || isDirectStream
      const copyAudio = isRemux

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

      if (copyAudio) {
        ffmpegArgs.push('-c:a', 'copy')
      } else if (audio?.audioCodec) {
        ffmpegArgs.push('-c:a', audio.audioCodec)
        if (audio?.bitrate) {
          ffmpegArgs.push('-b:a', `${audio.bitrate}k`)
        }
      } else {
        ffmpegArgs.push('-c:a', 'aac')
        ffmpegArgs.push('-b:a', '128k')
      }
      if (!copyAudio && audio?.mixdown) {
        ffmpegArgs.push('-ac', '2')
      }

      const videoStreamIndex = 0
      ffmpegArgs.push('-map', `0:v:${videoStreamIndex}`)

      if (copyVideo) {
        ffmpegArgs.push('-c:v', 'copy')
      } else {
        const videoCodec = video?.codec ?? 'libx264'
        ffmpegArgs.push('-c:v', videoCodec)

        const supportsPreset = videoCodec === 'libx264' || videoCodec === 'libx265'
        if (supportsPreset) {
          ffmpegArgs.push('-preset', config?.value?.preset ?? 'ultrafast')
        }

        if (videoCodec === 'libvpx-vp9') {
          ffmpegArgs.push('-row-mt', '1', '-cpu-used', '4')
        }

        if (videoCodec === 'libaom-av1') {
          ffmpegArgs.push('-cpu-used', '8', '-row-mt', '1')
        }

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
      }

      ffmpegArgs.push('pipe:1')

      return ffmpegArgs
    },
  })

  public init() {
    const configDataSet = getDataSetFor(this.injector, Config, 'id')
    configDataSet.subscribe('onEntityUpdated', ({ id }) => {
      if (id === 'MOVIES_CONFIG') {
        this.moviesConfigCache.setObsolete()
      }
    })
  }
}
