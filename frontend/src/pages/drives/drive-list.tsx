import { createComponent, LazyLoad, Shade } from '@furystack/shades'
import { Loader } from '@furystack/shades-common-components'
import { PiratApiClient } from '../../services/pirat-api-client'

export const DriveList = Shade({
  shadowDomName: 'drive-list',
  render: ({ injector }) => {
    return (
      <LazyLoad
        loader={<Loader />}
        component={async () => {
          const drives = await injector.getInstance(PiratApiClient).call({
            method: 'GET',
            action: '/drives',
            query: {
              findOptions: {},
            },
          })
          return (
            <div>
              {drives.result.entries.map((drive) => (
                <div>
                  {drive.letter} - {drive.physicalPath}
                </div>
              ))}
            </div>
          )
        }}
      />
    )
  },
})
