import type { ChildrenList } from '@furystack/shades'
import { LazyLoad } from '@furystack/shades'
import { createComponent, LocationService, Shade } from '@furystack/shades'
import type { DataGridProps } from '@furystack/shades-common-components'
import { Fab } from '@furystack/shades-common-components'
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

    const locationService = injector.getInstance(LocationService)

    const [mode, setMode] = useObservable(
      'mode',
      locationService.useSearchParam('mode', 'list' as 'list' | 'create' | 'edit'),
    )

    const [currentId, setCurrentId] = useObservable(
      'currentId',
      locationService.useSearchParam('currentId', null as string | null),
    )

    if (mode === 'edit' && currentId) {
      return (
        <LazyLoad
          loader={<></>}
          component={async () => {
            const entry = await service.getSingleEntry(currentId as any)
            return (
              <GenericMonacoEditor
                value={entry}
                onSave={async (value) => {
                  await service.patchEntry(currentId as any, value)
                }}
                service={service}
                model={model}
              />
            )
          }}
        />
      )
    }

    if (mode === 'create') {
      return (
        <GenericMonacoEditor
          service={service}
          model={model}
          value={{}}
          onSave={async (value) => {
            const response = await service.postEntry(value)
            setMode('edit')
            setCurrentId(response[service.extendedOptions.keyProperty] as string)
          }}
        />
      )
    }

    return (
      <>
        <DataGrid
          service={service}
          columns={columns}
          headerComponents={headerComponents}
          rowComponents={{
            [service.extendedOptions.keyProperty]: (value: any) => (
              <span
                ondblclick={() => {
                  setMode('edit')

                  setCurrentId(value[service.extendedOptions.keyProperty] as string)
                }}>
                {value[service.extendedOptions.keyProperty]}
              </span>
            ),
            ...rowComponents,
          }}
          styles={styles}
        />
        <Fab
          onclick={() => {
            setMode('create')
          }}>
          ➕
        </Fab>
      </>
    )
  },
})
