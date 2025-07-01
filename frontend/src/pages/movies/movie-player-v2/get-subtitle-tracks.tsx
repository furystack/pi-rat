import { createComponent } from '@furystack/shades'
import type { FfprobeData, PiRatFile } from 'common'
import { getFileName, getParentPath } from 'common'

import { environmentOptions } from '../../../environment-options.js'

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
