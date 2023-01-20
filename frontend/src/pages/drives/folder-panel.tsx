import { createComponent, Shade } from '@furystack/shades'
import { Paper } from '@furystack/shades-common-components'
import { ObservableValue, PathHelper } from '@furystack/utils'
import type { Drive } from 'common'
import { DriveSelector } from './drive-selector'
import { FileList } from './file-list'

export const FolderPanel = Shade<{ currentDrive: ObservableValue<Drive>; availableDrives: ObservableValue<Drive[]> }>({
  shadowDomName: 'folder-panel',
  render: ({ props, useObservable, element, useDisposable }) => {
    const currentLetter = useDisposable(
      'currentLetter',
      () => new ObservableValue(props.currentDrive.getValue().letter),
    )
    const currentPath = useDisposable('currentPath', () => new ObservableValue('/'))

    useObservable(
      'currentLetterObservable',
      props.currentDrive,
      (entry) => {
        entry && currentLetter.setValue(entry.letter)
        currentPath.setValue('/')
      },
      true,
    )
    element.style.height = '100%'
    element.style.width = '100%'
    return (
      <Paper
        elevation={1}
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: '0',
          flexShrink: '0',
          height: 'calc(100% - 42px)',
        }}>
        <DriveSelector currentDrive={props.currentDrive} availableDrives={props.availableDrives} />
        <FileList
          currentDriveLetter={currentLetter}
          currentPath={currentPath}
          onActivate={(v) => {
            if (v.isDirectory) {
              const path = currentPath.getValue()
              const newPath =
                v.name === '..'
                  ? path && PathHelper.getSegments(path).length > 1
                    ? PathHelper.getParentPath(path)
                    : '/'
                  : PathHelper.joinPaths(path || '/', v.name)
              currentPath.setValue(newPath)
              console.log('Changing path', { newPath })
            } else {
              console.log('onActivate', v)
            }
          }}
        />
      </Paper>
    )
  },
})
