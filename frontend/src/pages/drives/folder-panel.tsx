import { createComponent, Shade } from '@furystack/shades'
import type { CollectionService } from '@furystack/shades-common-components'
import { Paper } from '@furystack/shades-common-components'
import { PathHelper } from '@furystack/utils'
import type { Drive } from 'common'
import { DriveSelector } from './drive-selector'
import { FileList } from './file-list'

export const FolderPanel = Shade<
  { service: CollectionService<Drive> },
  { currentLetter?: string; currentPath?: string }
>({
  shadowDomName: 'folder-panel',
  resources: ({ props, updateState }) => [
    props.service.focusedEntry.subscribe((drive) => {
      updateState({ currentLetter: drive?.letter, currentPath: '/' })
    }),
  ],
  getInitialState: () => ({
    currentLetter: undefined,
    currentPath: undefined,
  }),
  render: ({ props, getState, updateState }) => {
    const { service } = props
    const { currentLetter, currentPath } = getState()
    return (
      <Paper
        elevation={1}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: '0',
          flexShrink: '0',
        }}>
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
              updateState({ currentPath: newPath })
            }
            console.log('onActivate', v)
          }}
        />
      </Paper>
    )
  },
})
