import { createComponent, Shade } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import { CreateDriveWizard } from './create-drive-wizard'
import { FolderPanel } from './folder-panel'

import { PiRatLazyLoad } from '../../components/pirat-lazy-load'
import { DrivesService } from '../../services/drives-service'

export const DrivesPage = Shade({
  shadowDomName: 'drives-page',
  render: ({ useDisposable, injector, useObservable }) => {
    const drivesService = injector.getInstance(DrivesService)
    const [drives] = useObservable('drives', drivesService.getVolumesAsObservable({}))

    if (drives.status !== 'loaded') {
      return null
    }

    if (drives.value.entries.length === 0) {
      return (
        <>
          <div>No drive created yet.</div>
          <CreateDriveWizard />
        </>
      )
    }

    const currentLeftDrive = useDisposable('currentLeftDrive', () => new ObservableValue(drives.value.entries[0]))

    const currentRightDrive = useDisposable('currentRightDrive', () => new ObservableValue(drives.value.entries[0]))

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
        <FolderPanel currentDrive={currentLeftDrive} />
        <FolderPanel currentDrive={currentRightDrive} />
        <CreateDriveWizard />
      </div>
    )
  },
})
