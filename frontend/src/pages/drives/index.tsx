import { createComponent, Shade } from '@furystack/shades'
import { CollectionService } from '@furystack/shades-common-components'
import type { Drive } from 'common'
import { DrivesApiClient } from '../../services/drives-api-client'
import { CreateDriveWizard } from './create-drive-wizard'
import { FolderPanel } from './folder-panel'

export const DrivesPage = Shade<
  unknown,
  {
    leftDrivesCollectionService: CollectionService<Drive>
    rightDrivesCollectionService: CollectionService<Drive>
  }
>({
  shadowDomName: 'drives-page',
  getInitialState: ({ injector }) => {
    const leftDrivesCollectionService = new CollectionService<Drive>({
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
    })
    const rightDrivesCollectionService = new CollectionService<Drive>({
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
    })
    leftDrivesCollectionService.getEntries({ ...leftDrivesCollectionService.querySettings.getValue() })
    rightDrivesCollectionService.getEntries({ ...rightDrivesCollectionService.querySettings.getValue() })
    return {
      leftDrivesCollectionService,
      rightDrivesCollectionService,
    }
  },
  render: ({ getState }) => {
    const { leftDrivesCollectionService, rightDrivesCollectionService } = getState()
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          top: '48px',
          position: 'fixed',
          flexDirection: 'row',
          gap: '8px',
          height: 'calc(100% - 48px)',
          width: '100%',
        }}>
        <FolderPanel service={leftDrivesCollectionService} />
        <FolderPanel service={rightDrivesCollectionService} />
        <CreateDriveWizard
          onDriveAdded={() => {
            leftDrivesCollectionService.getEntries({ ...leftDrivesCollectionService.querySettings.getValue() })
            rightDrivesCollectionService.getEntries({ ...rightDrivesCollectionService.querySettings.getValue() })
          }}
        />
      </div>
    )
  },
})
