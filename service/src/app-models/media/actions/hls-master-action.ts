import { getLogger } from '@furystack/logging'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult } from '@furystack/rest-service'
import type { MediaApi } from 'common'
import { FfprobeService } from '../../../ffprobe-service.js'
import {
  buildAudioTrackList,
  buildSubtitleTrackList,
  generateMasterPlaylist,
} from '../services/hls-manifest-generator.js'
import { resolvePlaybackMode } from '../services/stream-builder.js'

type HlsMasterEndpoint = MediaApi['GET']['/files/:letter/:path/master.m3u8']

export const HlsMasterAction: RequestAction<HlsMasterEndpoint> = async ({ injector, getUrlParams, response }) => {
  const logger = getLogger(injector).withScope('HlsMasterAction')
  const { letter, path } = getUrlParams()

  const file = { driveLetter: letter, path }
  const ffprobe = await injector.getInstance(FfprobeService).getFfprobeForPiratFile(file)

  const codecSupport = { video: ['h264'], audio: ['aac'], containers: ['mp4'] }
  const { mode } = resolvePlaybackMode({ ffprobe, codecSupport })

  const audioTracks = buildAudioTrackList(ffprobe)
  const subtitleTracks = buildSubtitleTrackList(ffprobe, file)

  const playlist = generateMasterPlaylist({
    ffprobe,
    file,
    mode,
    baseUrl: '/api/media',
    audioTracks,
    subtitleTracks,
  })

  await logger.verbose({ message: `Generated master playlist for ${letter}:${path}`, data: { mode } })

  response.writeHead(200, {
    'Content-Type': 'application/vnd.apple.mpegurl',
    'Content-Length': Buffer.byteLength(playlist),
    'Cache-Control': 'no-cache',
  })
  response.end(playlist)

  return BypassResult()
}
