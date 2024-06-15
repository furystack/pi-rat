import { Shade, createComponent } from '@furystack/shades'
import type { Movie, PiRatFile } from 'common'

export const MovieTitle = Shade<{ file: PiRatFile; movie?: Movie }>({
  shadowDomName: 'pirat-movie-title',
  render: ({ props }) => {
    const title = props.movie
      ? `${props.movie.title} (${props.movie.year})`
      : `${props.file.driveLetter}:${props.file.path}`

    return (
      <div
        style={{
          position: 'absolute',
          top: '32px',
          left: '16px',
          zIndex: '2147483647',
          textShadow: '2px 2px 16px black',
        }}
      >
        <h1>{title}</h1>
      </div>
    )
  },
})
