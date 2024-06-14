import { Shade, createComponent, styledShade } from '@furystack/shades'
import { Button, Input } from '@furystack/shades-common-components'
import type { ObservableValue } from '@furystack/utils'

type ControlAreaProps = {
  isPlaying: ObservableValue<boolean>
  isFullScreen: ObservableValue<boolean>
  isMuted: ObservableValue<boolean>
  volume: ObservableValue<number>
  watchedSeconds: ObservableValue<number>
  lengthSeconds: number
}

const ControlButton = styledShade(Button, {
  fontSize: '2em',
  padding: '.3em 1em',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: '100%',
})

export const SoundControl = Shade<{
  isMuted: ObservableValue<boolean>
  volume: ObservableValue<number>
}>({
  shadowDomName: 'pirat-movie-player-v2-sound-control',
  render: ({ props, useObservable }) => {
    const [isMuted, setIsMuted] = useObservable('isMuted', props.isMuted)
    const [volume] = useObservable('volume', props.volume)

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ControlButton title={isMuted ? 'Unmute' : 'Mute'} onclick={() => setIsMuted(!isMuted)}>
          {isMuted ? '🔇' : '🔊'}
        </ControlButton>
        <Input
          type="range"
          min="0"
          max="100"
          value={volume.toString()}
          onchange={(e) => props.volume.setValue((e.target as HTMLInputElement).value as any)}
        />
      </div>
    )
  },
})

export const ControlArea = Shade<ControlAreaProps>({
  shadowDomName: 'pirat-movie-player-v2-control-area',
  render: ({ props, useObservable, element }) => {
    const [isPlaying, setIsPlaying] = useObservable('isPlaying', props.isPlaying)
    const [progress, setProgress] = useObservable('progress', props.watchedSeconds, {
      onChange: (newProgressValue) => {
        ;(element.querySelector('.progress-bar') as HTMLInputElement)!.value = newProgressValue as any
      },
    })
    const [isFullScreen, setFullScreen] = useObservable('isFullScreen', props.isFullScreen)

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 80%, rgba(0,0,0,0) 100%)',
          width: '100%',
          height: '4em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '2147483647',
        }}>
        <Input
          className="progress-bar"
          type="range"
          min="0"
          max={props.lengthSeconds.toString()}
          value={progress.toString()}
          style={{
            position: 'absolute',
            top: '-15px',
            left: '10px',
            width: 'calc(100% - 20px)',
          }}
          onTextChange={(e) => setProgress(parseInt(e, 10))}
        />
        {isPlaying ? (
          <ControlButton title="Pause" onclick={() => setIsPlaying(false)}>
            <i className="material-icons">pause</i>
          </ControlButton>
        ) : (
          <ControlButton title="Play" onclick={() => setIsPlaying(true)}>
            <i className="material-icons">play_arrow</i>
          </ControlButton>
        )}
        <ControlButton title="Toggle full screen" onclick={() => setFullScreen(!isFullScreen)}>
          {isFullScreen ? (
            <i className="material-icons">fullscreen_exit</i>
          ) : (
            <i className="material-icons">fullscreen</i>
          )}
        </ControlButton>
        <SoundControl isMuted={props.isMuted} volume={props.volume} />
      </div>
    )
  },
})
