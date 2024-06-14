import { createComponent, Shade } from '@furystack/shades'
import { DrivesService } from '../../services/drives-service.js'
import { ErrorDisplay } from '../../components/error-display.js'
import type { DriveLocation } from './index.js'

export const DriveSelector = Shade<{
  searchStateKey: string
  defaultDriveLetter: string
}>({
  shadowDomName: 'drive-selector',
  render: ({ props, useObservable, injector, useSearchState }) => {
    const [currentDrive, setCurrentDrive] = useSearchState(props.searchStateKey, {
      path: '/',
      letter: props.defaultDriveLetter,
    } as DriveLocation)

    const drivesService = injector.getInstance(DrivesService)
    const [availableDrives] = useObservable('availableDrives', drivesService.getVolumesAsObservable({}))

    if (availableDrives.status === 'loading' || availableDrives.status === 'uninitialized') {
      return null // TODO: Skeleton
    }

    if (availableDrives.status === 'failed') {
      return <ErrorDisplay error={availableDrives.error} />
    }

    return (
      <select
        onchange={(ev) => {
          const { value } = ev.target as HTMLOptionElement

          if (currentDrive.letter !== value && availableDrives.value?.entries.find((e) => e.letter === value)) {
            setCurrentDrive({
              letter: value,
              path: '/',
            })
          }
        }}
      >
        {availableDrives.value.entries.map((r) => (
          <option value={r.letter} selected={currentDrive.letter === r.letter}>
            {r.letter}
          </option>
        ))}
      </select>
    )
  },
})
