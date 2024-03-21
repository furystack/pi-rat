import { createComponent, Shade } from '@furystack/shades'
import { CreateDriveWizard } from './create-drive-wizard.js'
import { FolderPanel } from './folder-panel.js'
import { DrivesService } from '../../services/drives-service.js'
import { hasCacheValue } from '@furystack/cache'

export type DriveLocation = {
  letter: string
  path: string
}

export const DrivesPage = Shade({
  shadowDomName: 'drives-page',
  render: ({ injector, useObservable, useSearchState }) => {
    const drivesService = injector.getInstance(DrivesService)
    const [drives] = useObservable('drives', drivesService.getVolumesAsObservable({}))

    const [focused] = useSearchState('focused', 'ld' as 'ld' | 'rd')

    if (!hasCacheValue(drives)) {
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
        <FolderPanel
          focused={focused === 'ld'}
          searchStateKey="ld"
          defaultDriveLetter={drives.value.entries[0].letter}
        />
        <FolderPanel
          focused={focused === 'rd'}
          searchStateKey="rd"
          defaultDriveLetter={drives.value.entries[0].letter}
        />
        <CreateDriveWizard />
      </div>
    )
  },
})
