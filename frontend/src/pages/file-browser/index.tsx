import { hasCacheValue, isObsoleteCacheResult } from '@furystack/cache'
import { createComponent, Shade } from '@furystack/shades'
import { DrivesService } from '../../services/drives-service.js'
import { CreateDriveWizard } from './create-drive-wizard.js'
import { FolderPanel } from './folder-panel.js'

export type DriveLocation = {
  letter: string
  path: string
}

export const DrivesPage = Shade({
  shadowDomName: 'drives-page',
  render: ({ injector, useObservable, useSearchState }) => {
    const drivesService = injector.getInstance(DrivesService)
    const [drives] = useObservable('drives', drivesService.getVolumesAsObservable({}))

    const [focused, setFocused] = useSearchState('focused', 'ld' as 'ld' | 'rd')

    if (!hasCacheValue(drives)) {
      return null
    }

    if (isObsoleteCacheResult(drives)) {
      void drivesService.getVolumes({})
    }

    if (drives.value.entries.length === 0) {
      return (
        <div style={{ marginTop: '8em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>No drives has been created yet.</div>
          <CreateDriveWizard />
        </div>
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
        }}
      >
        <FolderPanel
          focused={focused === 'ld'}
          searchStateKey="ld"
          defaultDriveLetter={drives.value.entries[0].letter}
          onclick={() => setFocused('ld')}
          onkeyup={(ev) => {
            if (ev.key === 'Tab') {
              ev.preventDefault()
              ev.stopImmediatePropagation()
              setFocused('rd')
            }
          }}
        />
        <FolderPanel
          focused={focused === 'rd'}
          searchStateKey="rd"
          defaultDriveLetter={drives.value.entries[0].letter}
          onclick={() => setFocused('rd')}
          onkeyup={(ev) => {
            if (ev.key === 'Tab') {
              ev.preventDefault()
              ev.stopImmediatePropagation()
              setFocused('ld')
            }
          }}
        />
        <CreateDriveWizard />
      </div>
    )
  },
})
