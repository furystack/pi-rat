import { createComponent, Shade } from '@furystack/shades'
import type { ObservableValue } from '@furystack/utils'
import type { Drive } from 'common'
import { DrivesService } from '../../services/drives-service.js'
import { ErrorDisplay } from '../../components/error-display.js'

export const DriveSelector = Shade<{ currentDrive: ObservableValue<Drive> }>({
  shadowDomName: 'drive-selector',
  render: ({ props, useObservable, injector }) => {
    const drivesService = injector.getInstance(DrivesService)
    const [availableDrives] = useObservable('availableDrives', drivesService.getVolumesAsObservable({}))
    const [currentDrive, setCurrentDrive] = useObservable('currentDrive', props.currentDrive)

    if (availableDrives.status === 'pending' || availableDrives.status === 'uninitialized') {
      return null // TODO: Skeleton
    }

    if (availableDrives.status === 'failed') {
      return <ErrorDisplay error={availableDrives.error} />
    }

    return (
      <select
        onchange={(ev) => {
          const { value } = ev.target as HTMLOptionElement
          setCurrentDrive(availableDrives.value?.entries.find((e) => e.letter === value) as Drive)
        }}>
        {availableDrives.value.entries.map((r) => (
          <option value={r.letter} selected={currentDrive.letter === r.letter}>
            {r.letter}
          </option>
        ))}
      </select>
    )
  },
})
