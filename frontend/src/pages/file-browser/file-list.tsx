import type { FindOptions } from '@furystack/core'
import { createComponent, Shade } from '@furystack/shades'
import type { CollectionService } from '@furystack/shades-common-components'
import {
  Button,
  ContextMenu,
  ContextMenuManager,
  DataGrid,
  Dialog,
  NotyService,
  SelectionCell,
} from '@furystack/shades-common-components'
import { PathHelper } from '@furystack/utils'
import { getFallbackMetadata, isMovieFile, isSampleFile, type DirectoryEntry } from 'common'

import { RelatedMoviesModal } from '../../components/movie-file-management/related-movies-modal.js'
import { MediaApiClient } from '../../services/api-clients/media-api-client.js'
import { DrivesService } from '../../services/drives-service.js'
import { getErrorMessage } from '../../services/get-error-message.js'
import { SessionService } from '../../services/session.js'
import { environmentOptions } from '../../utils/environment-options.js'
import { triggerDownload } from '../../utils/trigger-download.js'
import { BreadCrumbs } from './breadcrumbs.js'
import { DirectoryEntryIcon } from './directory-entry-icon.js'
import { getContextMenuItems } from './file-context-menu-items.js'
import { FileInfoModal } from './file-info-modal.js'
import { handleFileDrop } from './file-upload-handler.js'

export const FileList = Shade<{
  currentDriveLetter: string
  currentPath: string
  onChangePath: (newPath: string) => void
  onActivate?: (entry: DirectoryEntry) => void
  service: CollectionService<DirectoryEntry>
}>({
  customElementName: 'file-list',
  css: {
    '& .file-row': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: '16px',
    },
    '& .file-name': {
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      maxWidth: '35vw',
      overflow: 'hidden',
    },
  },
  render: ({ useDisposable, useState, props, injector }) => {
    const { currentDriveLetter, currentPath, service } = props

    const drivesService = injector.getInstance(DrivesService)
    const notyService = injector.getInstance(NotyService)
    const mediaApiClient = injector.getInstance(MediaApiClient)
    const sessionService = injector.getInstance(SessionService)

    const [findOptions, setFindOptions] = useState<FindOptions<DirectoryEntry, Array<keyof DirectoryEntry>>>(
      'findOptions',
      {},
    )

    const [activeEntry, setActiveEntry] = useState<DirectoryEntry | null>('activeEntry', null)
    const [isInfoVisible, setInfoVisible] = useState('isInfoVisible', false)
    const [isRelatedMoviesVisible, setRelatedMoviesVisible] = useState('isRelatedMoviesVisible', false)
    const [isDeleteDialogVisible, setDeleteDialogVisible] = useState('isDeleteDialogVisible', false)
    const [entriesToDelete, setEntriesToDelete] = useState<DirectoryEntry[]>('entriesToDelete', [])
    const [isDeleting, setDeleting] = useState('isDeleting', false)

    const contextMenuManager = useDisposable('contextMenuManager', () => new ContextMenuManager<() => void>())

    const collectDeleteTargets = (): DirectoryEntry[] => {
      const selection = service.selection.getValue()
      if (selection.length > 0) {
        return selection.filter((e) => e.name !== '..')
      }
      const focused = service.focusedEntry.getValue()
      if (focused && focused.name !== '..') {
        return [focused]
      }
      return []
    }

    const activate = () => {
      const focused = service.focusedEntry.getValue()
      const isComponentFocused = service.hasFocus.getValue()
      if (isComponentFocused && focused) {
        props.onActivate?.(focused)
      }
    }

    const requestDelete = () => {
      const targets = collectDeleteTargets()
      if (targets.length > 0) {
        setEntriesToDelete(targets)
        setDeleteDialogVisible(true)
      }
    }

    const handleContextMenu = (entry: DirectoryEntry, ev: MouseEvent) => {
      ev.preventDefault()
      setActiveEntry(entry)
      contextMenuManager.open({
        position: { x: ev.clientX, y: ev.clientY },
        items: getContextMenuItems(entry, {
          currentDriveLetter,
          currentPath,
          mediaApiClient,
          notyService,
          onActivate: props.onActivate,
          onShowRelatedMovies: () => setRelatedMoviesVisible(true),
          onShowFileInfo: () => setInfoVisible(true),
          onDeleteRequest: requestDelete,
        }),
      })
    }

    const handleDeleteConfirm = async () => {
      setDeleting(true)
      try {
        for (const entry of entriesToDelete) {
          await drivesService.removeFile({
            letter: currentDriveLetter,
            path: `${currentPath}/${entry.name}`,
          })
        }
        notyService.emit('onNotyAdded', {
          type: 'success',
          title: 'Delete completed',
          body: <>{entriesToDelete.length} item(s) deleted successfully</>,
        })
      } catch (err) {
        notyService.emit('onNotyAdded', {
          type: 'error',
          title: 'Delete failed',
          body: <>{getErrorMessage(err)}</>,
        })
      } finally {
        setDeleting(false)
        setDeleteDialogVisible(false)
        setEntriesToDelete([])
      }
    }

    useDisposable('keypressListener', () => {
      const listener = (ev: KeyboardEvent) => {
        if (ev.key === 'Enter') {
          activate()
        }

        // TODO
        if (ev.key === 'F3') {
          const focused = service.focusedEntry.getValue()
          if (focused) {
            const letter = currentDriveLetter
            const path = props.currentPath
            const url = `${environmentOptions.serviceUrl}/drives/files/${encodeURIComponent(
              letter,
            )}/${encodeURIComponent(PathHelper.joinPaths(path, focused.name))}/download`
            triggerDownload(url, focused.name)
          }
        }

        if (ev.key === 'Delete') {
          requestDelete()
        }
      }
      window.addEventListener('keydown', listener)
      return {
        [Symbol.dispose]: () => window.removeEventListener('keydown', listener),
      }
    })

    const activeEntryPath = activeEntry ? `${currentDriveLetter}:${currentPath}/${activeEntry.name}` : ''
    const activeMovieMetadata =
      activeEntry?.isFile &&
      activeEntryPath &&
      !isSampleFile(activeEntryPath) &&
      isMovieFile(activeEntryPath) &&
      getFallbackMetadata(activeEntryPath)

    return (
      <>
        <div
          data-testid="file-drop"
          ondragover={(ev) => {
            ev.preventDefault()
          }}
          ondrop={(ev) => {
            void handleFileDrop({ ev, sessionService, notyService, currentDriveLetter, currentPath })
          }}
          ondblclick={activate}
          onkeydown={(ev) => {
            if (ev.key === 'Enter') {
              activate()
            }
          }}
        >
          <DataGrid
            collectionService={service}
            findOptions={findOptions}
            onFindOptionsChange={setFindOptions}
            columns={['name']}
            headerComponents={{
              name: () => (
                <BreadCrumbs
                  currentDrive={currentDriveLetter}
                  currentPath={currentPath}
                  onChangePath={props.onChangePath}
                />
              ),
            }}
            styles={{}}
            rowComponents={{
              name: (entry) => (
                <div
                  className="file-row"
                  title={entry.name}
                  oncontextmenu={(ev: MouseEvent) => handleContextMenu(entry, ev)}
                >
                  <div>
                    <SelectionCell entry={entry} service={service} />
                  </div>
                  <div>
                    <DirectoryEntryIcon entry={entry} />
                  </div>
                  <div className="file-name">{entry.name}</div>
                </div>
              ),
            }}
          />
        </div>
        <ContextMenu manager={contextMenuManager} onItemSelect={(action) => action()} />
        {activeEntry && (
          <FileInfoModal
            entry={activeEntry}
            isInfoVisible={isInfoVisible}
            onClose={() => setInfoVisible(false)}
            currentDriveLetter={currentDriveLetter}
            currentPath={currentPath}
          />
        )}
        {activeEntry && activeMovieMetadata && (
          <RelatedMoviesModal
            drive={currentDriveLetter}
            path={currentPath}
            file={activeEntry}
            isOpened={isRelatedMoviesVisible}
            onClose={() => setRelatedMoviesVisible(false)}
          />
        )}
        <Dialog
          isVisible={isDeleteDialogVisible}
          title="Confirm Delete"
          onClose={isDeleting ? undefined : () => setDeleteDialogVisible(false)}
          actions={
            <>
              <Button onclick={() => setDeleteDialogVisible(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="contained" danger loading={isDeleting} onclick={handleDeleteConfirm}>
                Delete
              </Button>
            </>
          }
        >
          <p style={{ margin: '0 0 8px' }}>
            Are you sure you want to delete the following {entriesToDelete.length} item(s)?
          </p>
          <ul style={{ margin: '0', paddingLeft: '20px' }}>
            {entriesToDelete.map((e) => (
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 0' }}>
                <DirectoryEntryIcon entry={e} /> {e.name}
              </li>
            ))}
          </ul>
        </Dialog>
      </>
    )
  },
})
