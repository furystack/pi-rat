import { MovieFileDataSet } from '../media-data-sets.js'
import { getLogger } from '@furystack/logging'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import { getDataSetFor } from '@furystack/repository'
import type { PlaybackInfoRequest } from 'common'

import { FfprobeService } from '../../../ffprobe-service.js'
import { buildPlaybackInfoResponse } from '../services/stream-builder.js'

export const PlaybackInfoAction: RequestAction<PlaybackInfoRequest> = async ({ injector, getBody }) => {
  const logger = getLogger(injector).withScope('PlaybackInfoAction')
  const body = await getBody()
  const { file, codecSupport, selectedAudioTrackIndex, selectedSubtitleTrackIndex } = body

  if (file.path.includes('..') || file.path.includes('\0')) {
    throw new RequestError('Invalid file path', 400)
  }

  await logger.verbose({ message: 'Playback info requested', data: { file, selectedAudioTrackIndex } })

  const ffprobe = await injector.get(FfprobeService).getFfprobeForPiratFile(file)

  const movieFileDataSet = getDataSetFor(injector, MovieFileDataSet)
  const movieFiles = await movieFileDataSet.find(injector, {
    filter: { driveLetter: { $eq: file.driveLetter }, path: { $eq: file.path } },
    top: 1,
  })
  const movieFile = movieFiles[0]

  const response = buildPlaybackInfoResponse({
    ffprobe,
    file,
    codecSupport,
    selectedAudioTrackIndex,
    selectedSubtitleTrackIndex,
    relatedFiles: movieFile?.relatedFiles,
    streamBaseUrl: '/api/media',
    movieId: movieFile?.imdbId,
  })

  await logger.verbose({
    message: 'Playback info resolved',
    data: { mode: response.mode, warnings: response.warnings },
  })

  return JsonResult(response)
}
