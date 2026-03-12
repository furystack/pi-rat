import type { RefObject } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'

import { whenRefReady } from '../../../../utils/when-ref-ready.js'
import type { MoviePlayerService } from '../movie-player-service.js'
import { ControlBar } from './control-bar.js'
import { ErrorOverlay } from './error-overlay.js'
import { LoadingOverlay } from './loading-overlay.js'

type VideoContainerProps = {
  mediaService: MoviePlayerService
  playerContainerRef: RefObject<HTMLElement>
}

const IDLE_TIMEOUT_MS = 3000
const SEEK_STEP_SECONDS = 10

export const VideoContainer = Shade<VideoContainerProps>({
  customElementName: 'pirat-player-video-container',
  css: {
    display: 'block',
    position: 'absolute',
    inset: '0',
    '& .controls-wrapper': {
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      transition: 'opacity 0.3s ease',
      zIndex: '10',
    },
    '& .controls-wrapper.hidden': {
      opacity: '0',
      pointerEvents: 'none',
    },
  },
  render: ({ props, useDisposable, useState, useRef }) => {
    const containerRef = useRef<HTMLElement>('container')
    const [controlsHidden, setControlsHidden] = useState('controlsHidden', false)

    useDisposable('idleTimer', () => {
      let timerId: ReturnType<typeof setTimeout> | null = null

      const resetTimer = () => {
        setControlsHidden(false)
        if (timerId) clearTimeout(timerId)
        timerId = setTimeout(() => setControlsHidden(true), IDLE_TIMEOUT_MS)
      }

      const onMouseLeave = () => {
        setControlsHidden(true)
        if (timerId) {
          clearTimeout(timerId)
          timerId = null
        }
      }

      return whenRefReady(containerRef, (container) => {
        container.addEventListener('mousemove', resetTimer)
        container.addEventListener('mouseleave', onMouseLeave)
        container.addEventListener('mouseenter', resetTimer)
        resetTimer()

        return {
          [Symbol.dispose]: () => {
            if (timerId) clearTimeout(timerId)
            container.removeEventListener('mousemove', resetTimer)
            container.removeEventListener('mouseleave', onMouseLeave)
            container.removeEventListener('mouseenter', resetTimer)
          },
        }
      })
    })

    useDisposable('keyboardShortcuts', () =>
      whenRefReady(containerRef, (container) => {
        container.focus()

        const onKeyDown = (ev: KeyboardEvent) => {
          switch (ev.key) {
            case ' ':
            case 'k':
              ev.preventDefault()
              props.mediaService.togglePlay()
              break
            case 'ArrowLeft':
              ev.preventDefault()
              props.mediaService.seekToTime(Math.max(0, props.mediaService.progress.getValue() - SEEK_STEP_SECONDS))
              break
            case 'ArrowRight':
              ev.preventDefault()
              props.mediaService.seekToTime(props.mediaService.progress.getValue() + SEEK_STEP_SECONDS)
              break
            case 'm':
            case 'M':
              ev.preventDefault()
              props.mediaService.setMuted(!props.mediaService.isMuted.getValue())
              break
            case 'f':
            case 'F':
              ev.preventDefault()
              if (props.playerContainerRef.current) {
                props.mediaService.toggleFullscreen(props.playerContainerRef.current)
              }
              break
            default:
              break
          }
        }
        container.addEventListener('keydown', onKeyDown)
        return { [Symbol.dispose]: () => container.removeEventListener('keydown', onKeyDown) }
      }),
    )

    return (
      <div ref={containerRef} tabIndex={0} style={{ outline: 'none', width: '100%', height: '100%' }}>
        <LoadingOverlay mediaService={props.mediaService} />
        <ErrorOverlay mediaService={props.mediaService} />
        <div className={`controls-wrapper${controlsHidden ? ' hidden' : ''}`}>
          <ControlBar mediaService={props.mediaService} playerContainerRef={props.playerContainerRef} />
        </div>
      </div>
    )
  },
})
