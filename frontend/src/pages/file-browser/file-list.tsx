import { createComponent, Shade } from '@furystack/shades'
import { CollectionService, DataGrid, NotyService, SelectionCell } from '@furystack/shades-common-components'
import type { ObservableValue } from '@furystack/utils'
import { PathHelper } from '@furystack/utils'
import type { DirectoryEntry } from 'common'
import { environmentOptions } from '../../environment-options'
import { SessionService } from '../../services/session'
import { BreadCrumbs } from './breadcrumbs'
import { DirectoryEntryIcon } from './directory-entry-icon'
import { DrivesService } from '../../services/drives-service'

export const FileList = Shade<{
  currentDriveLetter: ObservableValue<string>
  currentPath: ObservableValue<string>
  onActivate?: (entry: DirectoryEntry) => void
}>({
  shadowDomName: 'file-list',
  render: ({ useDisposable, props, injector, useObservable }) => {
    const { currentDriveLetter, currentPath } = props

    const drivesService = injector.getInstance(DrivesService)
    const notyService = injector.getInstance(NotyService)

    const service = useDisposable(
      'service',
      () =>
        new CollectionService<DirectoryEntry>({
          loader: async () => {
            if (!currentDriveLetter.getValue() || !props.currentPath.getValue()) {
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

            const result = await drivesService.getFileList(currentDriveLetter.getValue(), currentPath.getValue())
            if (currentPath.getValue() !== '/') {
              return { ...result, entries: [up, ...result.entries.sortBy('isDirectory', 'desc')] }
            }
            return { ...result, entries: result.entries.sortBy('isDirectory', 'desc') }
          },
          defaultSettings: {},
        }),
    )
    const refetch = () => service.querySettings.setValue({ ...service.querySettings.getValue() })

    useObservable('onDriveChange', props.currentDriveLetter, refetch)
    useObservable('onFolderChange', props.currentPath, refetch)

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
            const letter = currentDriveLetter.getValue()
            const path = props.currentPath.getValue()
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
              .removeFile(
                currentDriveLetter.getValue(),
                encodeURIComponent(`${currentPath.getValue()}/${focused.name}`),
              )
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
                currentDriveLetter.getValue(),
              )}/${encodeURIComponent(currentPath.getValue())}/upload`,
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
            id: () => <BreadCrumbs currentDrive={currentDriveLetter} currentPath={currentPath} />,
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
