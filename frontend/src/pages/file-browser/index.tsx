import { createComponent, Shade } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import { CreateDriveWizard } from './create-drive-wizard'
import { FolderPanel } from './folder-panel'
import { AvailableDrivesService } from './available-drives-service'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load'

export const DrivesPage = Shade({
  shadowDomName: 'drives-page',
  render: ({ useDisposable, injector, useObservable }) => {
    const availableDrivesService = injector.getInstance(AvailableDrivesService)
    const [drives] = useObservable('drives', availableDrivesService.getDrivesAsObservable())

    if (drives.status !== 'loaded') {
      return null
    }

    return (
      <PiRatLazyLoad
        component={async () => {
          const availableDrives = useDisposable('availableDrives', () => new ObservableValue(drives.value.entries))
          availableDrives.setValue(drives.value.entries)
          if (!drives.value.entries.length) {
            return (
              <>
                <div>No drive created yet.</div>
                <CreateDriveWizard
                  onDriveAdded={async () => {
                    const reloadedDrives = await availableDrivesService.reload()
                    availableDrives.setValue(reloadedDrives.entries)
                  }}
                />
              </>
            )
          }

          const currentLeftDrive = useDisposable('currentLeftDrive', () => new ObservableValue(drives.value.entries[0]))

          const currentRightDrive = useDisposable(
            'currentRightDrive',
            () => new ObservableValue(drives.value.entries[0]),
          )

          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                top: '56px',
                position: 'fixed',
                flexDirection: 'row',
                gap: '8px',
                height: 'calc(100% - 48px)',
                width: '100%',
              }}>
              <FolderPanel currentDrive={currentLeftDrive} availableDrives={availableDrives} />
              <FolderPanel currentDrive={currentRightDrive} availableDrives={availableDrives} />
              <CreateDriveWizard
                onDriveAdded={async () => {
                  const reloadedDrives = await availableDrivesService.reload()
                  availableDrives.setValue(reloadedDrives.entries)
                }}
              />
            </div>
          )
        }}
      />
    )
  },
})
