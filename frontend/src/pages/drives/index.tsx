import { createComponent, Shade } from '@furystack/shades'
import { CollectionService, DataGrid } from '@furystack/shades-common-components'
import type { Drive } from 'common'
import { DrivesApiClient } from '../../services/drives-api-client'
import { CreateDriveWizard } from './create-drive-wizard'

export const DrivesPage = Shade<
  unknown,
  {
    collectionService: CollectionService<Drive>
  }
>({
  shadowDomName: 'drives-page',
  getInitialState: ({ injector }) => ({
    collectionService: new CollectionService<Drive>(async (options) => {
      const data = await injector.getInstance(DrivesApiClient).call({
        method: 'GET',
        action: '/',
        query: {
          findOptions: options,
        },
      })
      return data.result
    }, {}),
  }),
  render: ({ getState }) => {
    const { collectionService } = getState()
    return (
      <div
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '5em',
          flexDirection: 'column',
        }}>
        <DataGrid
          service={collectionService}
          styles={{
            wrapper: {
              position: 'fixed',
              top: '4em',
              left: '0',
              width: '100%',
              height: 'calc(100% - 12em)',
            },
          }}
          columns={['letter', 'physicalPath']}
          headerComponents={{}}
          rowComponents={{}}></DataGrid>
        <CreateDriveWizard
          onDriveAdded={() => collectionService.getEntries({ ...collectionService.querySettings.getValue() })}
        />
      </div>
    )
  },
})
