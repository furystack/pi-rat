import { createComponent, Shade } from '@furystack/shades'
import { CollectionService, Paper } from '@furystack/shades-common-components'
import { PathHelper } from '@furystack/utils'
import type { DirectoryEntry } from 'common'
import { encode } from 'common'
import { DriveSelector } from './drive-selector.js'
import { FileList } from './file-list.js'
import { navigateToRoute } from '../../navigate-to-route.js'
import { fileBrowserOpenFileRoute } from '../../components/routes/file-browser-routes.js'
import type { DriveLocation } from './index.js'
import { DrivesService } from '../../services/drives-service.js'

const upEntry: DirectoryEntry = {
  name: '..',
  isDirectory: true,
  isBlockDevice: false,
  isCharacterDevice: false,
  isFIFO: false,
  isFile: false,
  isSocket: false,
  isSymbolicLink: false,
}

export const FolderPanel = Shade<{
  searchStateKey: string
  defaultDriveLetter: string
  focused?: boolean
}>({
  shadowDomName: 'folder-panel',
  render: ({ props, element, injector, useDisposable, useSearchState, useObservable }) => {
    const drivesService = injector.getInstance(DrivesService)

    const [currentDrive, setCurrentDrive] = useSearchState(props.searchStateKey, {
      path: '/',
      letter: props.defaultDriveLetter,
    } as DriveLocation)

    const { letter, path } = currentDrive

    if (!letter || !path) {
      return null
    }

    const isRoot = path === '/'

    const service = useDisposable(
      `service ${letter} ${path}`,
      () =>
        new CollectionService<DirectoryEntry>({
          loader: async () => {
            const currentFiles = await drivesService.getFileList(letter, path)
            if (!isRoot) {
              return { ...currentFiles, entries: [upEntry, ...currentFiles.entries.sortBy('isDirectory', 'desc')] }
            }
            return { ...currentFiles, entries: currentFiles.entries.sortBy('isDirectory', 'desc') }
          },
          defaultSettings: {},
        }),
    )

    if (props.focused) {
      service.hasFocus.setValue(true)
    }

    useObservable('files', drivesService.getFileListAsObservable(letter, path), {
      onChange: (result) => {
        if (result.status === 'obsolete') {
          drivesService.getFileList(letter, path)
          return
        }
        if (result.value) {
          const newValue = isRoot ? result.value : { ...result.value, entries: [upEntry, ...result.value.entries] }
          service.focusedEntry.setValue(newValue.entries[0])
          service.data.setValue(newValue)
        }
      },
    })

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
        <DriveSelector defaultDriveLetter={props.defaultDriveLetter} searchStateKey={props.searchStateKey} />
        <FileList
          service={service}
          currentDriveLetter={letter}
          currentPath={path}
          onChangePath={(newPath) => setCurrentDrive({ letter: currentDrive.letter, path: newPath })}
          onActivate={(v) => {
            if (v.isDirectory) {
              const newPath =
                v.name === '..'
                  ? path && PathHelper.getSegments(path).length > 1
                    ? PathHelper.getParentPath(path)
                    : '/'
                  : PathHelper.joinPaths(path || '/', v.name)
              setCurrentDrive({ letter, path: newPath })
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
