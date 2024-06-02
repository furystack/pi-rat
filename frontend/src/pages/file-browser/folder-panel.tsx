import { createComponent, Shade } from '@furystack/shades'
import { CollectionService, Paper } from '@furystack/shades-common-components'
import { PathHelper } from '@furystack/utils'
import type { DirectoryEntry } from 'common'
import { encode } from 'common'
import { DriveSelector } from './drive-selector.js'
import { FileList } from './file-list.js'
import { navigateToRoute } from '../../navigate-to-route.js'
import { fileBrowserOpenFileRoute } from '../../components/routes/file-browser-routes.js'
import { DrivesService } from '../../services/drives-service.js'
import { hasCacheValue, type CacheResult } from '@furystack/cache'

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
    })

    const { letter, path } = currentDrive

    if (!letter || !path) {
      return null
    }

    const service = useDisposable(`service-${letter}-${path}`, () => new CollectionService<DirectoryEntry>())

    const onFileListChange = (result: CacheResult<Awaited<ReturnType<typeof drivesService.getFileList>>>) => {
      if (result.status === 'obsolete') {
        drivesService.getFileList(letter, path)
        return
      }
      if (hasCacheValue(result)) {
        const isRoot = result.value.path === '/'
        const newValue = isRoot ? result.value : { ...result.value, entries: [upEntry, ...result.value.entries] }
        const oldFocusedEntryName = service.focusedEntry.getValue()?.name
        service.data.setValue(newValue)

        if (service.hasFocus.getValue()) {
          service.focusedEntry.setValue(
            newValue.entries.find((e) => e.name === oldFocusedEntryName) || newValue.entries[0],
          )
        }
      }
    }

    const [fileList] = useObservable(`files-${letter}-${path}`, drivesService.getFileListAsObservable(letter, path), {
      onChange: onFileListChange,
    })
    onFileListChange(fileList)

    useDisposable('onFilesystemChanged', () =>
      drivesService.subscribe('onFilesystemChanged', () => drivesService.getFileList(letter, path)),
    )

    service.hasFocus.setValue(!!props.focused)

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
