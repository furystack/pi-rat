import { Shade, createComponent } from '@furystack/shades'

import type { MoviePlayerService } from '../movie-player-service.js'

type PosterOverlayProps = {
  mediaService: MoviePlayerService
  posterUrl?: string
}

export const PosterOverlay = Shade<PosterOverlayProps>({
  customElementName: 'pirat-player-poster-overlay',
  render: ({ props, useObservable }) => {
    const [isPlaying] = useObservable('isPlaying', props.mediaService.isPlaying)
    const [progress] = useObservable('progress', props.mediaService.progress)

    if (isPlaying || progress > 0 || !props.posterUrl) return <div />

    return (
      <div
        data-testid="poster-overlay"
        style={{
          position: 'absolute',
          inset: '0',
          backgroundImage: `url(${props.posterUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: '1',
          cursor: 'pointer',
        }}
        onclick={() => props.mediaService.togglePlay()}
      />
    )
  },
})
