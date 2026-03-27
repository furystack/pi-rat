import { Shade, createComponent } from '@furystack/shades'

import type { MoviePlayerService } from '../movie-player-service.js'

type ErrorOverlayProps = {
  mediaService: MoviePlayerService
}

/**
 * Waits for `mediaService.videoElement` to be set, then calls `callback`.
 * Uses rAF as a single-frame deferral since the video element is attached
 * synchronously during the same render cycle.
 */
const whenVideoReady = (
  mediaService: MoviePlayerService,
  callback: (video: HTMLVideoElement) => Disposable | void,
): Disposable => {
  const video = mediaService.videoElement
  if (video) {
    const cleanup = callback(video)
    return cleanup ?? { [Symbol.dispose]: () => {} }
  }

  let cleanup: Disposable | null = null
  const frameId = requestAnimationFrame(() => {
    const deferred = mediaService.videoElement
    if (deferred) {
      cleanup = callback(deferred) ?? null
    }
  })
  return {
    [Symbol.dispose]: () => {
      cancelAnimationFrame(frameId)
      cleanup?.[Symbol.dispose]()
    },
  }
}

export const ErrorOverlay = Shade<ErrorOverlayProps>({
  customElementName: 'pirat-player-error-overlay',
  render: ({ props, useState, useDisposable }) => {
    const [error, setError] = useState<string | null>('error', null)

    useDisposable('errorListener', () =>
      whenVideoReady(props.mediaService, (video) => {
        const handler = () => {
          const mediaError = video.error
          if (mediaError) {
            setError(`Playback error: ${mediaError.message || `code ${mediaError.code}`}`)
          }
        }
        video.addEventListener('error', handler)
        return { [Symbol.dispose]: () => video.removeEventListener('error', handler) }
      }),
    )

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
