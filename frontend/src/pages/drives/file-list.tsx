import { createComponent, Shade } from '@furystack/shades'
import { CollectionService, DataGrid, NotyService, SelectionCell } from '@furystack/shades-common-components'
import type { ObservableValue } from '@furystack/utils'
import { PathHelper } from '@furystack/utils'
import type { DirectoryEntry } from 'common/src/models/directory-entry'
import { environmentOptions } from '../../environment-options'
import { DrivesApiClient } from '../../services/drives-api-client'
import { SessionService } from '../../services/session'

export const FileList = Shade<{
  currentDriveLetter: ObservableValue<string>
  currentPath: ObservableValue<string>
  onActivate?: (entry: DirectoryEntry) => void
}>({
  shadowDomName: 'file-list',
  render: ({ useDisposable, props, injector, useObservable }) => {
    const { currentDriveLetter, currentPath } = props

    const client = injector.getInstance(DrivesApiClient)
    const notyService = injector.getInstance(NotyService)
    const refetch = () => service.querySettings.setValue({ ...service.querySettings.getValue() })

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

            const result = await client.call({
              method: 'GET',
              action: '/files/:letter/:path',
              url: {
                letter: currentDriveLetter.getValue(),
                path: encodeURIComponent(currentPath.getValue()),
              },
            })
            if (currentPath.getValue() !== '/') {
              return { ...result.result, entries: [up, ...result.result.entries] }
            }
            return result.result
          },
          defaultSettings: {},
        }),
    )

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
            ;(a as any).download = focused.name
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
          }
        }

        if (ev.key === 'Delete') {
          const focused = service.focusedEntry.getValue()
          focused &&
            client
              .call({
                method: 'DELETE',
                action: '/files/:letter/:path',
                url: {
                  letter: currentDriveLetter.getValue(),
                  path: encodeURIComponent(`${currentPath.getValue()}/${focused.name}`),
                },
              })
              .then(() => {
                refetch()
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
                refetch()
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
          columns={['id', 'name']}
          headerComponents={{}}
          styles={{}}
          rowComponents={{
            name: ({ name }) => <>{name}</>,
            id: (entry) => <SelectionCell entry={entry} service={service} />,
          }}
        />
      </div>
    )
  },
})
