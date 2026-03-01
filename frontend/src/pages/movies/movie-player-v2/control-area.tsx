import { Shade, createComponent, styledShade } from '@furystack/shades'
import type { IconDefinition } from '@furystack/shades-common-components'
import { Button, Icon, icons, Input } from '@furystack/shades-common-components'
import type { ObservableValue } from '@furystack/utils'

const maximizeIcon: IconDefinition = {
  name: 'Maximize',
  description: 'Expand to full screen',
  keywords: ['fullscreen', 'maximize', 'expand'],
  category: 'Actions',
  paths: [{ d: 'M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3' }],
}

const minimizeIcon: IconDefinition = {
  name: 'Minimize',
  description: 'Exit full screen',
  keywords: ['fullscreen', 'minimize', 'shrink'],
  category: 'Actions',
  paths: [{ d: 'M4 14h6v6m10-10h-6V4m0 6l7-7M3 21l7-7' }],
}

type ControlAreaProps = {
  isPlaying: ObservableValue<boolean>
  isFullScreen: ObservableValue<boolean>
  isMuted: ObservableValue<boolean>
  volume: ObservableValue<number>
  watchedSeconds: ObservableValue<number>
  lengthSeconds: number
  seekTo: (seconds: number) => void
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
  css: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  render: ({ props, useObservable }) => {
    const [isMuted, setIsMuted] = useObservable('isMuted', props.isMuted)
    const [volume] = useObservable('volume', props.volume)

    return (
      <>
        <ControlButton title={isMuted ? 'Unmute' : 'Mute'} onclick={() => setIsMuted(!isMuted)}>
          {isMuted ? '🔇' : '🔊'}
        </ControlButton>
        <Input
          type="range"
          min="0"
          max="100"
          value={volume.toString()}
          onchange={(e) => props.volume.setValue((e.target as HTMLInputElement).value as unknown as number)}
        />
      </>
    )
  },
})

export const ControlArea = Shade<ControlAreaProps>({
  shadowDomName: 'pirat-movie-player-v2-control-area',
  css: {
    '& .control-bar': {
      position: 'absolute',
      bottom: '0',
      background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 80%, rgba(0,0,0,0) 100%)',
      width: '100%',
      height: '4em',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '2147483647',
    },
    '& .progress-bar': {
      position: 'absolute',
      top: '-15px',
      left: '10px',
      width: 'calc(100% - 20px)',
    },
  },
  render: ({ props, useObservable }) => {
    const [isPlaying, setIsPlaying] = useObservable('isPlaying', props.isPlaying)
    const [progress] = useObservable('progress', props.watchedSeconds)
    const [isFullScreen, setFullScreen] = useObservable('isFullScreen', props.isFullScreen)

    return (
      <div className="control-bar">
        <Input
          className="progress-bar"
          type="range"
          min="0"
          max={props.lengthSeconds.toString()}
          value={progress.toString()}
          onTextChange={(e) => props.seekTo(parseInt(e, 10))}
        />
        {isPlaying ? (
          <ControlButton title="Pause" onclick={() => setIsPlaying(false)}>
            <Icon icon={icons.pause} />
          </ControlButton>
        ) : (
          <ControlButton title="Play" onclick={() => setIsPlaying(true)}>
            <Icon icon={icons.play} />
          </ControlButton>
        )}
        <ControlButton title="Toggle full screen" onclick={() => setFullScreen(!isFullScreen)}>
          {isFullScreen ? <Icon icon={minimizeIcon} /> : <Icon icon={maximizeIcon} />}
        </ControlButton>
        <SoundControl isMuted={props.isMuted} volume={props.volume} />
      </div>
    )
  },
})
