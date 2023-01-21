import { createComponent, LazyLoad, Shade } from '@furystack/shades'
import { Loader } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import { environmentOptions } from '../../environment-options'
import { DrivesApiClient } from '../../services/drives-api-client'
import { CreateDriveWizard } from './create-drive-wizard'
import { FolderPanel } from './folder-panel'

export const DrivesPage = Shade({
  shadowDomName: 'drives-page',
  render: ({ useDisposable, injector }) => {
    const loadDrives = async () =>
      await injector.getInstance(DrivesApiClient).call({
        method: 'GET',
        action: '/volumes',
        query: {
          findOptions: {},
        },
      })

    useDisposable('ws', () => {
      const socket = new WebSocket(`${environmentOptions.serviceUrl}/ws`.replace('http', 'ws'))
      socket.onmessage = (ev) => {
        const messageData = JSON.parse(ev.data)
        console.log(messageData)
      }
      return {
        dispose: () => {
          socket.close()
        },
      }
    })

    return (
      <LazyLoad
        loader={<Loader />}
        component={async () => {
          const drives = await loadDrives()

          const availableDrives = useDisposable('availableDrives', () => new ObservableValue(drives.result.entries))
          availableDrives.setValue(drives.result.entries)
          if (!drives.result.entries.length) {
            return (
              <>
                <div>No drive created yet.</div>
                <CreateDriveWizard
                  onDriveAdded={async () => {
                    const reloadedDrives = await loadDrives()
                    availableDrives.setValue(reloadedDrives.result.entries)
                  }}
                />
              </>
            )
          }

          const currentLeftDrive = useDisposable(
            'currentLeftDrive',
            () => new ObservableValue(drives.result.entries[0]),
          )

          const currentRightDrive = useDisposable(
            'currentRightDrive',
            () => new ObservableValue(drives.result.entries[0]),
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
                  const reloadedDrives = await loadDrives()
                  availableDrives.setValue(reloadedDrives.result.entries)
                }}
              />
            </div>
          )
        }}
      />
    )
  },
})
