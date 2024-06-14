import { Shade, createComponent } from '@furystack/shades'
import { Button } from '@furystack/shades-common-components'
import type { ObservableValue } from '@furystack/utils'

type ControlAreaProps = {
  isPlaying: ObservableValue<boolean>
  onPlay?: () => void
  onPause?: () => void
  onFullScreen?: () => void
}

export const ControlArea = Shade<ControlAreaProps>({
  shadowDomName: 'pirat-movie-player-v2-control-area',
  render: ({ props, useObservable }) => {
    const [isPlaying] = useObservable('isPlaying', props.isPlaying)
    return (
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 80%, rgba(0,0,0,0) 100%)',
          width: '100%',
          height: '3em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '2147483647',
        }}
      >
        {isPlaying ? <Button onclick={props.onPause}>⏸️</Button> : <Button onclick={props.onPlay}>▶️</Button>}
        <Button onclick={props.onFullScreen}>🎞️</Button>
      </div>
    )
  },
})
