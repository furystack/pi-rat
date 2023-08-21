import { createComponent, Shade } from '@furystack/shades'
import { CreateDriveWizard } from './create-drive-wizard.js'
import { FolderPanel } from './folder-panel.js'
import { DrivesService } from '../../services/drives-service.js'

export type DriveLocation = {
  letter: string
  path: string
}

export const DrivesPage = Shade({
  shadowDomName: 'drives-page',
  render: ({ injector, useObservable, useSearchState }) => {
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

    const [currentLeftDrive, setCurrentLeftDrive] = useSearchState('ld', {
      letter: drives.value.entries[0].letter,
      path: '/',
    })

    const [currentRightDrive, setCurrentRightDrive] = useSearchState('rd', {
      letter: drives.value.entries[0].letter,
      path: '/',
    })

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
        <FolderPanel currentDrive={currentLeftDrive} setCurrentDrive={setCurrentLeftDrive} />
        <FolderPanel currentDrive={currentRightDrive} setCurrentDrive={setCurrentRightDrive} />
        <CreateDriveWizard />
      </div>
    )
  },
})
