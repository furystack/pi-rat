import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '@furystack/shades-common-components'

import type { MoviePlayerService } from '../movie-player-service.js'

type SeekBarProps = {
  mediaService: MoviePlayerService
}

export const SeekBar = Shade<SeekBarProps>({
  customElementName: 'pirat-player-seek-bar',
  css: {
    display: 'flex',
    alignItems: 'center',
    flex: '1',
    position: 'relative',
    height: '20px',
    cursor: 'pointer',
    '& .seek-track': {
      position: 'absolute',
      width: '100%',
      height: '4px',
      borderRadius: '2px',
      background: 'rgba(255, 255, 255, 0.2)',
      overflow: 'hidden',
    },
    '& .seek-buffered': {
      position: 'absolute',
      height: '100%',
      background: 'rgba(255, 255, 255, 0.35)',
    },
    '& .seek-played': {
      position: 'absolute',
      height: '100%',
      background: cssVariableTheme.palette.primary.main,
    },
    '& input[type="range"]': {
      position: 'absolute',
      width: '100%',
      height: '100%',
      margin: '0',
      opacity: '0',
      cursor: 'pointer',
      zIndex: '1',
    },
  },
  render: ({ props, useObservable }) => {
    const [progress] = useObservable('progress', props.mediaService.progress)
    const [duration] = useObservable('duration', props.mediaService.duration)
    const [buffered] = useObservable('buffered', props.mediaService.buffered)

    const playedPercent = duration > 0 ? (progress / duration) * 100 : 0

    let bufferedPercent = 0
    if (buffered && buffered.length > 0 && duration > 0) {
      const end = buffered.end(buffered.length - 1)
      const absoluteBuffered = props.mediaService.streamTimeToAbsolute(end)
      bufferedPercent = (absoluteBuffered / duration) * 100
    }

    return (
      <div data-testid="seek-bar">
        <div className="seek-track">
          <div className="seek-buffered" style={{ width: `${Math.min(bufferedPercent, 100)}%` }} />
          <div className="seek-played" style={{ width: `${Math.min(playedPercent, 100)}%` }} />
        </div>
        <input
          type="range"
          min="0"
          max={duration.toString()}
          value={progress.toString()}
          step="1"
          oninput={(ev) => {
            const target = ev.currentTarget as HTMLInputElement
            const targetTime = parseFloat(target.value)
            if (!isNaN(targetTime)) {
              props.mediaService.seekToTime(targetTime)
            }
          }}
        />
      </div>
    )
  },
})
