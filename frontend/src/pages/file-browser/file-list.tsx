import { createComponent, Shade } from '@furystack/shades'
import { CollectionService, DataGrid, NotyService, SelectionCell } from '@furystack/shades-common-components'
import { PathHelper } from '@furystack/utils'
import type { DirectoryEntry } from 'common'
import { environmentOptions } from '../../environment-options.js'
import { SessionService } from '../../services/session.js'
import { BreadCrumbs } from './breadcrumbs.js'
import { DirectoryEntryIcon } from './directory-entry-icon.js'
import { DrivesService } from '../../services/drives-service.js'

export const FileList = Shade<{
  currentDriveLetter: string
  currentPath: string
  onChangePath: (newPath: string) => void
  onActivate?: (entry: DirectoryEntry) => void
}>({
  shadowDomName: 'file-list',
  render: ({ useDisposable, props, injector }) => {
    const { currentDriveLetter, currentPath } = props

    const drivesService = injector.getInstance(DrivesService)
    const notyService = injector.getInstance(NotyService)

    // const [entries] = useObservable('entries', drivesService.getFileListAsObservable(currentDriveLetter, currentPath))

    const service = useDisposable(
      'service',
      () =>
        new CollectionService<DirectoryEntry>({
          loader: async () => {
            if (!props.currentDriveLetter || !props.currentPath) {
              return { count: 0, entries: [] }
            }

            const up: DirectoryEntry = {
              name: '..',
              isDirectory: true,
              isBlockDevice: false,
              isCharacterDevice: false,
              isFIFO: false,
              isFile: false,
              isSocket: false,
              isSymbolicLink: false,
            }

            const result = await drivesService.getFileList(currentDriveLetter, currentPath)
            if (currentPath !== '/') {
              return { ...result, entries: [up, ...result.entries.sortBy('isDirectory', 'desc')] }
            }
            return { ...result, entries: result.entries.sortBy('isDirectory', 'desc') }
          },
          defaultSettings: {},
        }),
    )

    const activate = () => {
      const focused = service.focusedEntry.getValue()
      const isComponentFocused = service.hasFocus.getValue()
      isComponentFocused && focused && props.onActivate?.(focused)
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
            const a = document.createElement('a') as HTMLAnchorElement
            a.href = url
            a.target = '_blank'
            a.download = focused.name
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
          }
        }

        if (ev.key === 'Delete') {
          const focused = service.focusedEntry.getValue()
          focused &&
            drivesService
              .removeFile(currentDriveLetter, encodeURIComponent(`${currentPath}/${focused.name}`))
              .then(() => {
                notyService.addNoty({
                  type: 'success',
                  title: 'Delete completed',
                  body: <>The file is deleted succesfully</>,
                })
              })
              .catch((err) =>
                notyService.addNoty({ title: 'Delete failed', body: <>{err.toString()}</>, type: 'error' }),
              )
        }
      }
      window.addEventListener('keydown', listener)
      return {
        dispose: () => window.removeEventListener('keydown', listener),
      }
    })

    return (
      <div
        ondragover={(ev) => {
          ev.preventDefault()
        }}
        ondrop={async (ev) => {
          ev.preventDefault()
          if (ev.dataTransfer?.files) {
            const session = injector.getInstance(SessionService)
            if (!(await session.isAuthorized('admin'))) {
              return notyService.addNoty({
                type: 'warning',
                title: 'Not authorized',
                body: <>You are not authorized to upload files</>,
              })
            }

            const formData = new FormData()
            for (const file of ev.dataTransfer.files) {
              formData.append('uploads', file)
            }
            await fetch(
              `${environmentOptions.serviceUrl}/drives/volumes/${encodeURIComponent(
                currentDriveLetter,
              )}/${encodeURIComponent(currentPath)}/upload`,
              {
                method: 'POST',
                credentials: 'include',
                body: formData,
              },
            )
              .then(() => {
                notyService.addNoty({
                  type: 'success',
                  title: 'Upload completed',
                  body: <>The files are upploaded succesfully</>,
                })
              })
              .catch((err) =>
                notyService.addNoty({ title: 'Upload failed', body: <>{err.toString()}</>, type: 'error' }),
              )
          }
        }}
        ondblclick={activate}
        onkeydown={(ev) => {
          if (ev.key === 'Enter') {
            activate()
          }
        }}>
        <DataGrid<DirectoryEntry & { id: any }>
          service={service as any}
          autofocus
          columns={['id']}
          headerComponents={{
            id: () => (
              <BreadCrumbs
                currentDrive={currentDriveLetter}
                currentPath={currentPath}
                onChangePath={props.onChangePath}
              />
            ),
          }}
          styles={{}}
          rowComponents={{
            id: (entry) => (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: '16px',
                }}
                title={entry.name}>
                <div>
                  <SelectionCell entry={entry} service={service} />
                </div>
                <div>
                  <DirectoryEntryIcon entry={entry} />
                </div>
                <div style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '35vw', overflow: 'hidden' }}>
                  {entry.name}
                </div>
              </div>
            ),
          }}
        />
      </div>
    )
  },
})
