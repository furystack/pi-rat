import type { CacheWithValue } from '@furystack/cache'
import type { GetCollectionResult } from '@furystack/rest'
import { createComponent, Shade } from '@furystack/shades'
import { CacheView, Select, Skeleton } from '@furystack/shades-common-components'
import type { Drive } from 'common'
import { DrivesService } from '../../services/drives-service.js'
import { ErrorDisplay } from '../../components/error-display.js'

const DriveSelectorContent = Shade<{
  data: CacheWithValue<GetCollectionResult<Drive>>
  searchStateKey: string
  defaultDriveLetter: string
}>({
  customElementName: 'drive-selector-content',
  render: ({ props, useSearchState }) => {
    const [currentDrive, setCurrentDrive] = useSearchState(props.searchStateKey, {
      path: '/',
      letter: props.defaultDriveLetter,
    })

    return (
      <Select
        options={props.data.value.entries.map((r) => ({ value: r.letter, label: r.letter }))}
        value={currentDrive.letter}
        onValueChange={(value) => {
          if (currentDrive.letter !== value && props.data.value.entries.find((e) => e.letter === value)) {
            setCurrentDrive({
              letter: value,
              path: '/',
            })
          }
        }}
      />
    )
  },
})

export const DriveSelector = Shade<{
  searchStateKey: string
  defaultDriveLetter: string
}>({
  customElementName: 'drive-selector',
  render: ({ props, injector }) => {
    const drivesService = injector.get(DrivesService)

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
