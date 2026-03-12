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
  customElementName: 'drives-page',
  css: {
    '& .empty-state': {
      marginTop: '8em',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    '& .drives-container': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      top: '56px',
      position: 'fixed',
      flexDirection: 'row',
      gap: '8px',
      height: 'calc(100% - 48px)',
      width: '100%',
    },
  },
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
        <div className="empty-state">
          <div>No drives has been created yet.</div>
          <CreateDriveWizard />
        </div>
      )
    }

    return (
      <div className="drives-container" data-testid="drives-container">
        <FolderPanel
          focused={focused === 'ld'}
          searchStateKey="ld"
          defaultDriveLetter={drives.value.entries[0].letter}
          availableDriveLetters={drives.value.entries.map((e) => e.letter)}
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
          availableDriveLetters={drives.value.entries.map((e) => e.letter)}
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
