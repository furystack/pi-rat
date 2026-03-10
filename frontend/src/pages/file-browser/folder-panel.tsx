import { hasCacheValue, type CacheResult } from '@furystack/cache'
import { createComponent, Shade } from '@furystack/shades'
import { CollectionService, Paper } from '@furystack/shades-common-components'
import { PathHelper } from '@furystack/utils'
import type { DirectoryEntry } from 'common'
import { encode, getFullPath } from 'common'
import { navigateToRoute } from '../../utils/navigate-to-route.js'
import { DrivesService } from '../../services/drives-service.js'
import { DriveSelector } from './drive-selector.js'
import { FileList } from './file-list.js'

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
  customElementName: 'folder-panel',
  css: {
    height: '100%',
    width: '50%',
    flexGrow: '0',
    flexShrink: '0',
    '& .folder-panel-paper': {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: '0',
      flexShrink: '0',
      height: 'calc(100% - 42px)',
    },
  },
  render: ({ props, injector, useDisposable, useSearchState, useObservable }) => {
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
        void drivesService.getFileList(letter, path)
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
      drivesService.subscribe('onFilesystemChanged', () => void drivesService.getFileList(letter, path)),
    )

    service.hasFocus.setValue(!!props.focused)

    return (
      <Paper elevation={1} className="folder-panel-paper">
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
              navigateToRoute(injector, '/file-browser/open-file/:driveLetter/:path', {
                driveLetter: encode(currentDrive.letter),
                path: encode(getFullPath(path, v.name)),
              })
            }
          }}
        />
      </Paper>
    )
  },
})
