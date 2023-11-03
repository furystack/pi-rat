import type { ChildrenList } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import type { CollectionService, DataGridProps } from '@furystack/shades-common-components'
import { NotyService } from '@furystack/shades-common-components'
import { Button, SelectionCell } from '@furystack/shades-common-components'
import { Fab } from '@furystack/shades-common-components'
import { DataGrid } from '@furystack/shades-common-components'
import type { GenericEditorService } from './generic-editor-service.js'
import { GenericMonacoEditor } from './generic-monaco-editor.js'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'
import type { Uri } from 'monaco-editor'

type CreateEditorState = {
  mode: 'create'
}

type ListEditorState = {
  mode: 'list'
}

type EditEditorState = {
  mode: 'edit'
  currentId: string
}

type GenericEditorState = CreateEditorState | ListEditorState | EditEditorState

type GenericEditorProps<T, TKey extends keyof T, TReadonlyProperties extends keyof T> = {
  service: GenericEditorService<T, TKey, TReadonlyProperties>
  columns: DataGridProps<T>['columns']
  headerComponents: DataGridProps<T>['headerComponents']
  rowComponents: DataGridProps<T>['rowComponents']
  styles: DataGridProps<T>['styles']
  modelUri?: Uri
}

export const GenericEditor: <T, TKey extends keyof T, TReadonlyProperties extends keyof T>(
  props: GenericEditorProps<T, TKey, TReadonlyProperties>,
  childrenList: ChildrenList,
) => JSX.Element = Shade({
  shadowDomName: 'shade-generic-editor',
  render: ({ props, injector, useSearchState }) => {
    const { service, columns, headerComponents, rowComponents, styles, modelUri } = props

    const refresh = () => service.querySettings.setValue({ ...service.querySettings.getValue() })

    const noty = injector.getInstance(NotyService)

    const [editorState, setEditorState] = useSearchState<GenericEditorState>('gedst', {
      mode: 'list',
    })

    if (editorState.mode === 'edit' && editorState.currentId) {
      return (
        <PiRatLazyLoad
          component={async () => {
            const entry = await service.getSingleEntry(editorState.currentId as any)
            return (
              <GenericMonacoEditor
                value={entry}
                onSave={async (value) => {
                  try {
                    await service.patchEntry(editorState.currentId as any, value)
                    noty.addNoty({ type: 'success', title: '📝 Entity updated', body: 'Entity updated successfully' })
                    refresh()
                  } catch (error) {
                    noty.addNoty({
                      type: 'error',
                      title: '❗ Failed to update entity',
                      body: (error as Error).toString(),
                    })
                  }
                }}
                service={service}
                modelUri={modelUri}
              />
            )
          }}
        />
      )
    }

    if (editorState.mode === 'create') {
      return (
        <GenericMonacoEditor
          service={service}
          modelUri={modelUri}
          value={{}}
          onSave={async (value) => {
            try {
              const response = await service.postEntry(value)
              setEditorState({
                mode: 'edit',
                currentId: response[service.extendedOptions.keyProperty] as string,
              })
              noty.addNoty({ type: 'success', title: '✨ Entity created', body: 'Entity created successfully' })
              refresh()
            } catch (error) {
              noty.addNoty({ type: 'error', title: '❗ Failed to create entity', body: (error as Error).toString() })
            }
          }}
        />
      )
    }

    return (
      <>
        <DataGrid
          service={service}
          columns={['selection' as any, ...columns, 'actions' as any]}
          headerComponents={{ actions: () => null, ...headerComponents }}
          rowComponents={{
            selection: (entry) => <SelectionCell entry={entry} service={service as CollectionService<any>} />,
            actions: (entry) => (
              <div style={{ width: '156px' }}>
                <Button
                  onclick={() => {
                    setEditorState({ mode: 'edit', currentId: entry[service.extendedOptions.keyProperty] as string })
                    refresh()
                  }}>
                  ✏️
                </Button>
                <Button
                  onclick={() => {
                    service
                      .removeEntries(entry[service.extendedOptions.keyProperty] as any)
                      .then(() => {
                        noty.addNoty({
                          type: 'success',
                          title: 'Entity deleted',
                          body: '🗑️ The selected entity deleted successfully',
                        })
                        refresh()
                      })
                      .catch((error) => {
                        noty.addNoty({
                          type: 'error',
                          title: '❗ Failed to delete entity',
                          body: (error as Error).toString(),
                        })
                      })
                  }}>
                  ❌
                </Button>
              </div>
            ),
            ...rowComponents,
          }}
          styles={{
            ...styles,
            header: { width: '128px', ...styles?.header },
            cell: { width: '128px', ...styles?.cell },
            wrapper: { marginTop: '56px', ...styles?.wrapper },
          }}
        />
        <Fab
          onclick={() => {
            setEditorState({ mode: 'create' })
          }}>
          ➕
        </Fab>
      </>
    )
  },
})
