import { createComponent } from '@furystack/shades'
import type { PiRatFile } from 'common'
import { getFileName, getParentPath } from 'common'
import type { FfprobeData } from 'fluent-ffmpeg'

import { environmentOptions } from '../../../environment-options.js'

export const getSubtitleTracks = (file: PiRatFile, ffProbeData: FfprobeData) => {
  const fileName = getFileName(file)
  const parentPath = getParentPath(file)
  const { driveLetter } = file

  return (
    ffProbeData.streams
      .filter((stream) => (stream.codec_type as any) === 'subtitle')
      .map((subtitle) => (
        <track
          kind="captions"
          label={subtitle.tags.title || subtitle.tags.language || subtitle.tags.filename}
          src={`${environmentOptions.serviceUrl}/drives/files/${encodeURIComponent(
            driveLetter,
          )}/${encodeURIComponent(`${parentPath}/${fileName}-subtitle-${subtitle.index}.vtt`)}/download`}
          srclang={subtitle.tags.language}
        />
      )) || []
  )
}
