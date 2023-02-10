import { createComponent, Shade } from '@furystack/shades'
import type { ObservableValue } from '@furystack/utils'
import type { Drive } from 'common'

export const DriveSelector = Shade<{ currentDrive: ObservableValue<Drive>; availableDrives: ObservableValue<Drive[]> }>(
  {
    shadowDomName: 'drive-selector',
    render: ({ props, useObservable }) => {
      const [availableDrives] = useObservable('availableDrives', props.availableDrives)
      const [currentDrive, setCurrentDrive] = useObservable('currentDrive', props.currentDrive)
      return (
        <select
          onchange={(ev) => {
            const { value } = ev.target as HTMLOptionElement
            setCurrentDrive(availableDrives.find((e) => e.letter === value) as Drive)
          }}>
          {availableDrives.map((r) => (
            <option value={r.letter} selected={currentDrive.letter === r.letter}>
              {r.letter}
            </option>
          ))}
        </select>
      )
    },
  },
)
