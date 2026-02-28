import type { CacheWithValue } from '@furystack/cache'
import type { GetCollectionResult } from '@furystack/rest'
import { createComponent, Shade } from '@furystack/shades'
import { CacheView, Skeleton } from '@furystack/shades-common-components'
import type { Drive } from 'common'
import { DrivesService } from '../../services/drives-service.js'
import { ErrorDisplay } from '../../components/error-display.js'
import type { DriveLocation } from './index.js'

const DriveSelectorContent = Shade<{
  data: CacheWithValue<GetCollectionResult<Drive>>
  searchStateKey: string
  defaultDriveLetter: string
}>({
  shadowDomName: 'drive-selector-content',
  render: ({ props, useSearchState }) => {
    const [currentDrive, setCurrentDrive] = useSearchState(props.searchStateKey, {
      path: '/',
      letter: props.defaultDriveLetter,
    } as DriveLocation)

    return (
      <select
        onchange={(ev) => {
          const { value } = ev.target as HTMLOptionElement

          if (currentDrive.letter !== value && props.data.value.entries.find((e) => e.letter === value)) {
            setCurrentDrive({
              letter: value,
              path: '/',
            })
          }
        }}
      >
        {props.data.value.entries.map((r) => (
          <option value={r.letter} selected={currentDrive.letter === r.letter}>
            {r.letter}
          </option>
        ))}
      </select>
    )
  },
})

export const DriveSelector = Shade<{
  searchStateKey: string
  defaultDriveLetter: string
}>({
  shadowDomName: 'drive-selector',
  render: ({ props, injector }) => {
    const drivesService = injector.getInstance(DrivesService)

    return (
      <CacheView
        cache={drivesService.volumesCache}
        args={[{}]}
        content={DriveSelectorContent}
        contentProps={{ searchStateKey: props.searchStateKey, defaultDriveLetter: props.defaultDriveLetter }}
        loader={<Skeleton />}
        error={(err) => <ErrorDisplay error={err} />}
      />
    )
  },
})
