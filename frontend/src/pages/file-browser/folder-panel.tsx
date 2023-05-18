import { createComponent, Shade } from '@furystack/shades'
import { Paper } from '@furystack/shades-common-components'
import type { ObservableValue } from '@furystack/utils'
import { PathHelper } from '@furystack/utils'
import type { Drive } from 'common'
import { encode } from 'common'
import { DriveSelector } from './drive-selector.js'
import { FileList } from './file-list.js'
import { navigateToRoute } from '../../navigate-to-route.js'
import { fileBrowserOpenFileRoute } from '../../components/routes/file-browser-routes.js'

export const FolderPanel = Shade<{ currentDrive: ObservableValue<Drive> }>({
  shadowDomName: 'folder-panel',
  render: ({ props, useObservable, element, useState, injector }) => {
    const [currentDrive] = useObservable('currentLetter', props.currentDrive)

    const [currentPath, setCurrentPath] = useState('currentPath', '/')

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
        <DriveSelector currentDrive={props.currentDrive} />
        <FileList
          currentDriveLetter={currentDrive.letter}
          currentPath={currentPath}
          onChangePath={setCurrentPath}
          onActivate={(v) => {
            const path = currentPath

            if (v.isDirectory) {
              const newPath =
                v.name === '..'
                  ? path && PathHelper.getSegments(path).length > 1
                    ? PathHelper.getParentPath(path)
                    : '/'
                  : PathHelper.joinPaths(path || '/', v.name)
              setCurrentPath(newPath)
            } else {
              navigateToRoute(injector, fileBrowserOpenFileRoute, {
                driveLetter: encode(currentDrive.letter),
                path: encode(PathHelper.joinPaths(path, v.name)),
              })
            }
          }}
        />
      </Paper>
    )
  },
})
