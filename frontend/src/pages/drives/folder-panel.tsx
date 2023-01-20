import { createComponent, Shade } from '@furystack/shades'
import type { CollectionService } from '@furystack/shades-common-components'
import { Paper } from '@furystack/shades-common-components'
import { PathHelper } from '@furystack/utils'
import type { Drive } from 'common'
import { DriveSelector } from './drive-selector'
import { FileList } from './file-list'

export const FolderPanel = Shade<{ service: CollectionService<Drive> }>({
  shadowDomName: 'folder-panel',
  render: ({ props, useState, useObservable }) => {
    const { service } = props
    const [currentLetter, setCurrentLetter] = useState<string | undefined>('currentLetter', undefined)
    const [currentPath, setCurrentPath] = useState('currentPath', '/')
    useObservable('currentLetterObservable', service.focusedEntry, (entry) => {
      setCurrentLetter(entry?.letter)
      setCurrentPath('/')
    })
    return (
      <Paper elevation={1}>
        <DriveSelector currentDrive={service.focusedEntry} />
        <FileList
          currentDriveLetter={currentLetter}
          currentPath={currentPath}
          onActivate={(v) => {
            if (v.isDirectory) {
              const newPath =
                v.name === '..'
                  ? currentPath && PathHelper.getSegments(currentPath).length > 1
                    ? PathHelper.getParentPath(currentPath)
                    : '/'
                  : PathHelper.joinPaths(currentPath || '/', v.name)
              setCurrentPath(newPath)
            }
            console.log('onActivate', v)
          }}
        />
      </Paper>
    )
  },
})
