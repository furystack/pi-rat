import { createComponent } from '@furystack/shades'
import type { FfprobeData, PiRatFile, SubtitleTrackInfo } from 'common'
import { getFileName, getParentPath } from 'common'

import { environmentOptions } from '../../../utils/environment-options.js'

/**
 * Builds subtitle track elements from playback-info response data when available,
 * falling back to the legacy ffprobe-based approach for backward compatibility.
 */
export const getSubtitleTracksFromPlaybackInfo = (subtitleTracks: SubtitleTrackInfo[]) => {
  return subtitleTracks
    .filter((track) => !track.requiresBurnIn && track.url)
    .map((track) => (
      <track
        kind="captions"
        label={track.label}
        src={`${environmentOptions.serviceUrl}${track.url?.startsWith('/api') ? track.url.slice(4) : track.url}`}
        srclang={track.language}
      />
    ))
}

export const getSubtitleTracks = (file: PiRatFile, ffProbeData: FfprobeData) => {
  const fileName = getFileName(file)
  const parentPath = getParentPath(file)
  const { driveLetter } = file

  return (
    ffProbeData.streams
      .filter((stream) => stream.codec_type === 'subtitle')
      .map((subtitle) => (
        <track
          kind="captions"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          label={subtitle.tags.title || subtitle.tags.language || subtitle.tags.filename}
          src={`${environmentOptions.serviceUrl}/drives/files/${encodeURIComponent(
            driveLetter,
          )}/${encodeURIComponent(`${parentPath}/${fileName}-subtitle-${subtitle.index}.vtt`)}/download`}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          srclang={subtitle.tags.language}
        />
      )) || []
  )
}
