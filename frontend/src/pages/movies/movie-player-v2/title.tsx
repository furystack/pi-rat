import { Shade, createComponent } from '@furystack/shades'
import type { Movie, PiRatFile } from 'common'

export const MovieTitle = Shade<{ file: PiRatFile; movie?: Movie }>({
  shadowDomName: 'pirat-movie-title',
  render: ({ props }) => {
    return (
      <div
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
        }}>
        <h1>{props.movie?.title || `${props.file.driveLetter}:${props.file.path}`}</h1>
      </div>
    )
  },
})
