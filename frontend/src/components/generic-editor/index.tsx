import type { ChildrenList } from '@furystack/shades'
import { createComponent, LocationService, Shade } from '@furystack/shades'
import type { DataGridProps } from '@furystack/shades-common-components'
import { DataGrid } from '@furystack/shades-common-components'
import type { GenericEditorService } from './generic-editor-service'
import type monaco from 'monaco-editor'
import { GenericMonacoEditor } from './generic-monaco-editor'

type GenericEditorProps<T, TKey extends keyof T> = {
  service: GenericEditorService<T, TKey>
  columns: DataGridProps<T>['columns']
  headerComponents: DataGridProps<T>['headerComponents']
  rowComponents: DataGridProps<T>['rowComponents']
  styles: DataGridProps<T>['styles']
  model?: monaco.editor.ITextModel
}

export const GenericEditor: <T, TKey extends keyof T>(
  props: GenericEditorProps<T, TKey>,
  childrenList: ChildrenList,
) => JSX.Element = Shade({
  shadowDomName: 'shade-generic-editor',
  render: ({ props, injector, useObservable }) => {
    const { service, columns, headerComponents, rowComponents, styles, model } = props

    const [currentId, setCurrentId] = useObservable(
      'currentId',
      injector.getInstance(LocationService).useSearchParam<any>('currentId', null),
    )

    if (currentId) {
      return <GenericMonacoEditor entityId={currentId} service={service} model={model} />
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
