import { Shade, createComponent } from '@furystack/shades'

import type { MoviePlayerService } from '../movie-player-service.js'

type TimeDisplayProps = {
  mediaService: MoviePlayerService
}

export const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export const TimeDisplay = Shade<TimeDisplayProps>({
  customElementName: 'pirat-player-time-display',
  render: ({ props, useObservable }) => {
    const [progress] = useObservable('progress', props.mediaService.progress)
    const [duration] = useObservable('duration', props.mediaService.duration)

    return (
      <span
        data-testid="time-display"
        style={{
          fontSize: '13px',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
          padding: '0 8px',
          userSelect: 'none',
        }}
      >
        {formatTime(progress)} / {formatTime(duration)}
      </span>
    )
  },
})
