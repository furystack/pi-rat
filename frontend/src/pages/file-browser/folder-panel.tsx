import { createComponent, Shade } from '@furystack/shades'
import { Paper } from '@furystack/shades-common-components'
import { PathHelper } from '@furystack/utils'
import { encode } from 'common'
import { DriveSelector } from './drive-selector.js'
import { FileList } from './file-list.js'
import { navigateToRoute } from '../../navigate-to-route.js'
import { fileBrowserOpenFileRoute } from '../../components/routes/file-browser-routes.js'
import type { DriveLocation } from './index.js'

export const FolderPanel = Shade<{
  currentDrive: DriveLocation
  setCurrentDrive: (newDriveLocation: DriveLocation) => void
}>({
  shadowDomName: 'folder-panel',
  render: ({ props, element, injector }) => {
    element.style.height = '100%'
    element.style.width = '50%'
    element.style.flexGrow = '0'
    element.style.flexShrink = '0'
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
        <DriveSelector currentDrive={props.currentDrive} setCurrentDrive={props.setCurrentDrive} />
        <FileList
          currentDriveLetter={props.currentDrive.letter}
          currentPath={props.currentDrive.path}
          onChangePath={(newPath) => props.setCurrentDrive({ letter: props.currentDrive.letter, path: newPath })}
          onActivate={(v) => {
            const { path } = props.currentDrive

            if (v.isDirectory) {
              const newPath =
                v.name === '..'
                  ? path && PathHelper.getSegments(path).length > 1
                    ? PathHelper.getParentPath(path)
                    : '/'
                  : PathHelper.joinPaths(path || '/', v.name)
              props.setCurrentDrive({ letter: props.currentDrive.letter, path: newPath })
            } else {
              navigateToRoute(injector, fileBrowserOpenFileRoute, {
                driveLetter: encode(props.currentDrive.letter),
                path: encode(PathHelper.joinPaths(path, v.name)),
              })
            }
          }}
        />
      </Paper>
    )
  },
})
