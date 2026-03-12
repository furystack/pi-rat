import { Shade, createComponent } from '@furystack/shades'

import type { MoviePlayerService } from '../movie-player-service.js'

type LoadingOverlayProps = {
  mediaService: MoviePlayerService
}

export const LoadingOverlay = Shade<LoadingOverlayProps>({
  customElementName: 'pirat-player-loading-overlay',
  render: ({ props, useObservable }) => {
    const [isSwitching] = useObservable('isSwitching', props.mediaService.isSwitching)

    if (!isSwitching) return <div />

    return (
      <div
        data-testid="loading-overlay"
        style={{
          position: 'absolute',
          inset: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: '5',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  },
})
