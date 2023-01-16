import { createComponent, Shade } from '@furystack/shades'
import { CollectionService } from '@furystack/shades-common-components'
import type { Drive } from 'common'
import { DrivesApiClient } from '../../services/drives-api-client'
import { CreateDriveWizard } from './create-drive-wizard'
import { FolderPanel } from './folder-panel'

export const DrivesPage = Shade<
  unknown,
  {
    collectionService: CollectionService<Drive>
  }
>({
  shadowDomName: 'drives-page',
  getInitialState: ({ injector }) => ({
    collectionService: new CollectionService<Drive>({
      loader: async (options) => {
        const data = await injector.getInstance(DrivesApiClient).call({
          method: 'GET',
          action: '/volumes',
          query: {
            findOptions: options,
          },
        })
        return data.result
      },
      defaultSettings: {},
    }),
  }),
  render: ({ getState }) => {
    const { collectionService } = getState()
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          top: '48px',
          position: 'fixed',
          flexDirection: 'column',
          height: 'calc(100% - 48px)',
          width: '100%',
        }}>
        <FolderPanel service={collectionService} />
        <CreateDriveWizard
          onDriveAdded={() => collectionService.getEntries({ ...collectionService.querySettings.getValue() })}
        />
      </div>
    )
  },
})
