import { Shade, createComponent } from '@furystack/shades'

import type { MoviePlayerService } from '../movie-player-service.js'

type ErrorOverlayProps = {
  mediaService: MoviePlayerService
}

export const ErrorOverlay = Shade<ErrorOverlayProps>({
  customElementName: 'pirat-player-error-overlay',
  render: ({ props, useState, useDisposable }) => {
    const [error, setError] = useState<string | null>('error', null)

    useDisposable('errorListener', () => {
      const onError = (video: HTMLVideoElement) => {
        const mediaError = video.error
        if (mediaError) {
          setError(`Playback error: ${mediaError.message || `code ${mediaError.code}`}`)
        }
      }

      const video = props.mediaService.videoElement
      if (video) {
        const handler = () => onError(video)
        video.addEventListener('error', handler)
        return { [Symbol.dispose]: () => video.removeEventListener('error', handler) }
      }

      let cleanup: Disposable | null = null
      const frameId = requestAnimationFrame(() => {
        const deferredVideo = props.mediaService.videoElement
        if (deferredVideo) {
          const handler = () => onError(deferredVideo)
          deferredVideo.addEventListener('error', handler)
          cleanup = { [Symbol.dispose]: () => deferredVideo.removeEventListener('error', handler) }
        }
      })
      return {
        [Symbol.dispose]: () => {
          cancelAnimationFrame(frameId)
          cleanup?.[Symbol.dispose]()
        },
      }
    })

    if (!error) return <div />

    return (
      <div
        data-testid="error-overlay"
        style={{
          position: 'absolute',
          inset: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          fontSize: '16px',
          padding: '24px',
          textAlign: 'center',
          zIndex: '5',
        }}
      >
        {error}
      </div>
    )
  },
})
