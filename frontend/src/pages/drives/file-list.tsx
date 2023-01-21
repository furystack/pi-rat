import { createComponent, Shade } from '@furystack/shades'
import { CollectionService, DataGrid, SelectionCell } from '@furystack/shades-common-components'
import type { ObservableValue } from '@furystack/utils'
import type { DirectoryEntry } from 'common/src/models/directory-entry'
import { DrivesApiClient } from '../../services/drives-api-client'

export const FileList = Shade<{
  currentDriveLetter: ObservableValue<string>
  currentPath: ObservableValue<string>
  onActivate?: (entry: DirectoryEntry) => void
}>({
  shadowDomName: 'file-list',
  render: ({ useDisposable, props, injector, useObservable }) => {
    const { currentDriveLetter, currentPath } = props

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

            const result = await injector.getInstance(DrivesApiClient).call({
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

    useObservable('onDriveChange', props.currentDriveLetter, () => {
      service.querySettings.setValue({ ...service.querySettings.getValue() })
    })

    useObservable('onFolderChange', props.currentPath, () => {
      service.querySettings.setValue({ ...service.querySettings.getValue() })
    })

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
      }
      window.addEventListener('keydown', listener)
      return {
        dispose: () => window.removeEventListener('keydown', listener),
      }
    })

    return (
      <div
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
