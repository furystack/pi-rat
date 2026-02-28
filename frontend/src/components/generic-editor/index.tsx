import type { ChildrenList } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import type { CollectionService, DataGridProps } from '@furystack/shades-common-components'
import { Button, DataGrid, Fab, NotyService, SelectionCell } from '@furystack/shades-common-components'
import type { Uri } from 'monaco-editor'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'
import type { GenericEditorService } from './generic-editor-service.js'
import { GenericMonacoEditor } from './generic-monaco-editor.js'

type CreateEditorState = {
  mode: 'create'
}

type ListEditorState = {
  mode: 'list'
}

type EditEditorState<T, TKey extends keyof T> = {
  mode: 'edit'
  currentId: T[TKey]
}

type GenericEditorState<T, TKey extends keyof T> = CreateEditorState | ListEditorState | EditEditorState<T, TKey>

type GenericEditorProps<T, TKey extends keyof T, TReadonlyProperties extends keyof T, TColumns extends string> = {
  service: GenericEditorService<T, TKey, TReadonlyProperties>
  columns: DataGridProps<T, TColumns>['columns']
  headerComponents: DataGridProps<T, TColumns>['headerComponents']
  rowComponents: DataGridProps<T, TColumns>['rowComponents']
  styles: DataGridProps<T, TColumns>['styles']
  modelUri?: Uri
}

type EntityFromProps<Props> = Props extends { service: GenericEditorService<infer T, any, any> } ? T : never

type EntityKeyFromProps<Props> = Props extends { service: GenericEditorService<any, infer TKey, any> } ? TKey : never

export const GenericEditor: <T, TKey extends keyof T, TReadonlyProperties extends keyof T, TColumns extends string>(
  props: GenericEditorProps<T, TKey, TReadonlyProperties, TColumns>,
  childrenList: ChildrenList,
) => JSX.Element = Shade({
  shadowDomName: 'shade-generic-editor',
  render: ({ props, injector, useSearchState }) => {
    const { service, columns, headerComponents, rowComponents, styles, modelUri } = props

    const refresh = () => service.findOptions.setValue({ ...service.findOptions.getValue() })

    const noty = injector.getInstance(NotyService)

    const [editorState, setEditorState] = useSearchState<
      GenericEditorState<EntityFromProps<typeof props>, EntityKeyFromProps<typeof props>>
    >('gedst', {
      mode: 'list',
    })

    if (editorState.mode === 'edit' && editorState.currentId) {
      return (
        <PiRatLazyLoad
          component={async () => {
            const entry = await service.getSingleEntry(editorState.currentId)
            return (
              <GenericMonacoEditor
                value={entry!}
                service={service}
                onSave={async (value) => {
                  try {
                    await service.patchEntry(editorState.currentId, value)
                    noty.emit('onNotyAdded', {
                      type: 'success',
                      title: '📝 Entity updated',
                      body: 'Entity updated successfully',
                    })
                    refresh()
                  } catch (error) {
                    noty.emit('onNotyAdded', {
                      type: 'error',
                      title: '❗ Failed to update entity',
                      body: (error as Error).toString(),
                    })
                  }
                }}
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
          value={{} as EntityFromProps<typeof props>}
          onSave={async (value) => {
            try {
              const response = await service.postEntry(value)
              setEditorState({
                mode: 'edit',
                currentId: response[service.extendedOptions.keyProperty] as EntityFromProps<
                  typeof props
                >[EntityKeyFromProps<typeof props>],
              })
              noty.emit('onNotyAdded', {
                type: 'success',
                title: '✨ Entity created',
                body: 'Entity created successfully',
              })
              refresh()
            } catch (error) {
              noty.emit('onNotyAdded', {
                type: 'error',
                title: '❗ Failed to create entity',
                body: (error as Error).toString(),
              })
            }
          }}
        />
      )
    }

    const extendedHeaderComponents = { actions: () => null, ...headerComponents }
    const extendedRowComponents = {
      selection: (entry: EntityFromProps<typeof props>) => (
        <SelectionCell entry={entry} service={service as CollectionService<EntityFromProps<typeof props>>} />
      ),
      actions: (entry: EntityFromProps<typeof props>) => (
        <div style={{ width: '156px' }}>
          <Button
            onclick={() => {
              setEditorState({ mode: 'edit', currentId: entry[service.extendedOptions.keyProperty] })
              refresh()
            }}
          >
            ✏️
          </Button>
          <Button
            onclick={() => {
              service
                .removeEntries(entry[service.extendedOptions.keyProperty])
                .then(() => {
                  noty.emit('onNotyAdded', {
                    type: 'success',
                    title: 'Entity deleted',
                    body: '🗑️ The selected entity deleted successfully',
                  })
                  refresh()
                })
                .catch((error) => {
                  noty.emit('onNotyAdded', {
                    type: 'error',
                    title: '❗ Failed to delete entity',
                    body: (error as Error).toString(),
                  })
                })
            }}
          >
            ❌
          </Button>
        </div>
      ),
      ...rowComponents,
    }

    return (
      <>
        <DataGrid
          collectionService={service}
          findOptions={service.findOptions}
          columns={['selection', ...columns, 'actions'] as unknown as typeof columns}
          headerComponents={extendedHeaderComponents as unknown as typeof headerComponents}
          rowComponents={extendedRowComponents as unknown as typeof rowComponents}
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
          }}
        >
          ➕
        </Fab>
      </>
    )
  },
})
