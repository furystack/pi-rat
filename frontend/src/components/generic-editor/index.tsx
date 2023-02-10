import type { ChildrenList } from '@furystack/shades'
import { createComponent, LazyLoad, LocationService, Shade } from '@furystack/shades'
import type { DataGridProps } from '@furystack/shades-common-components'
import { DataGrid } from '@furystack/shades-common-components'
import { MonacoEditor } from '../monaco-editor'
import type { GenericEditorService } from './generic-editor-service'

type GenericEditorProps<T, TKey extends keyof T> = {
  service: GenericEditorService<T, TKey>
  columns: DataGridProps<T>['columns']
  headerComponents: DataGridProps<T>['headerComponents']
  rowComponents: DataGridProps<T>['rowComponents']
  styles: DataGridProps<T>['styles']
}

export const GenericEditor: <T, TKey extends keyof T>(
  props: GenericEditorProps<T, TKey>,
  childrenList: ChildrenList,
) => JSX.Element = Shade({
  shadowDomName: 'shade-generic-editor',
  render: ({ props, injector, useObservable }) => {
    const { service, columns, headerComponents, rowComponents, styles } = props

    const [currentId, setCurrentId] = useObservable(
      'currentId',
      injector.getInstance(LocationService).useSearchParam<any>('currentId', null),
    )

    if (currentId) {
      return (
        <LazyLoad
          loader={<>Loading...</>}
          component={async () => {
            const entry = await service.getSingleEntry(currentId)
            return (
              <div style={{ position: 'fixed', top: '64px', height: 'calc(100% - 64px)', width: '100%' }}>
                <MonacoEditor
                  options={{
                    language: 'json',
                  }}
                  value={JSON.stringify(entry, undefined, 4)}
                />
              </div>
            )
          }}
        />
      )
    }

    return (
      <DataGrid
        service={service}
        columns={columns}
        headerComponents={headerComponents}
        rowComponents={{
          [service.extendedOptions.keyProperty]: (value: any) => (
            <span
              ondblclick={() => {
                setCurrentId(value[service.extendedOptions.keyProperty])
              }}>
              {value[service.extendedOptions.keyProperty]}
            </span>
          ),
          ...rowComponents,
        }}
        styles={styles}
      />
    )
  },
})
