import { createComponent } from '@furystack/shades'
import { getFileName, getParentPath, type MovieFile } from 'common'
import { environmentOptions } from '../../../environment-options.js'

export const getSubtitleTracks = (movieFile: MovieFile) => {
  const fileName = getFileName(movieFile)
  const parentPath = getParentPath(movieFile)
  const { driveLetter } = movieFile

  return (
    movieFile.ffprobe.streams
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
