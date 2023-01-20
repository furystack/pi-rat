import { createComponent, Shade } from '@furystack/shades'
import type { CollectionService } from '@furystack/shades-common-components'
import { Paper } from '@furystack/shades-common-components'
import { PathHelper } from '@furystack/utils'
import type { Drive } from 'common'
import { useQueryStringVariable } from '../../services/query-string-service'
import { DriveSelector } from './drive-selector'
import { FileList } from './file-list'

export const FolderPanel = Shade<
  { service: CollectionService<Drive>; urlDrive?: string },
  { currentLetter?: string; currentPath?: string }
>({
  shadowDomName: 'folder-panel',
  resources: ({ props, updateState, injector }) => [
    props.service.focusedEntry.subscribe((drive) => {
      updateState({ currentLetter: drive?.letter, currentPath: '/' })
    }),
    useQueryStringVariable({
      injector,
      key: 'drive',
      defaultValue: props.service.data.getValue().entries[0]?.letter,
      updateStrategy: 'push',
    }),
  ],
  getInitialState: ({ props }) => ({
    currentPath: '/',
  }),
  render: ({ props, getState, updateState, element }) => {
    const { service } = props
    const { currentLetter, currentPath } = getState()
    element.style.height = '100%'
    element.style.width = '100%'
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
