import { createComponent, LazyLoad, Shade } from '@furystack/shades'
import { Autocomplete, Loader } from '@furystack/shades-common-components'
import type { ObservableValue } from '@furystack/utils'
import type { Drive } from 'common'
import { DrivesApiClient } from '../../services/drives-api-client'

export const DriveSelector = Shade<{ currentDrive: ObservableValue<Drive | undefined> }>({
  shadowDomName: 'drive-selector',
  render: ({ injector, props }) => {
    return (
      <LazyLoad
        loader={<Loader />}
        component={async () => {
          const { result } = await injector.getInstance(DrivesApiClient).call({
            method: 'GET',
            action: '/volumes',
            query: {
              findOptions: {},
            },
          })

          return (
            <Autocomplete
              strict
              inputProps={{ labelTitle: 'Select Drive', value: props.currentDrive.getValue()?.letter }}
              suggestions={result.entries.map((r) => r.letter)}
              onchange={(value) => {
                props.currentDrive.setValue(result.entries.find((e) => e.letter === value))
              }}
            />
          )
        }}
      />
    )
  },
})
