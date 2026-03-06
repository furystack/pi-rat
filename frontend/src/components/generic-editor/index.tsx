import type { ChildrenList } from '@furystack/shades'
import { LocationService, compileRoute, createComponent, Shade } from '@furystack/shades'
import type { CollectionService, DataGridProps } from '@furystack/shades-common-components'
import { Button, DataGrid, Fab, Icon, icons, NotyService, SelectionCell } from '@furystack/shades-common-components'
import { match } from 'path-to-regexp'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'
import type { GenericEditorService } from './generic-editor-service.js'

/**
 * Must stay in sync with `SchemaInfo` in `monaco-mfe/src/schema.ts`.
 */
export type EditorSchemaInfo = {
  schemaName: string
  jsonSchema: Record<string, unknown>
}

type GenericEditorProps<T, TKey extends keyof T, TReadonlyProperties extends keyof T, TColumns extends string> = {
  service: GenericEditorService<T, TKey, TReadonlyProperties>
  basePath: string
  columns: DataGridProps<T, TColumns>['columns']
  headerComponents: DataGridProps<T, TColumns>['headerComponents']
  rowComponents: DataGridProps<T, TColumns>['rowComponents']
  styles: DataGridProps<T, TColumns>['styles']
  schemaInfo?: EditorSchemaInfo
}

type EntityFromProps<Props> = Props extends { service: GenericEditorService<infer T, any, any> } ? T : never

type EntityKeyFromProps<Props> = Props extends { service: GenericEditorService<any, infer TKey, any> } ? TKey : never

export const GenericEditor: <T, TKey extends keyof T, TReadonlyProperties extends keyof T, TColumns extends string>(
  props: GenericEditorProps<T, TKey, TReadonlyProperties, TColumns>,
  childrenList: ChildrenList,
) => JSX.Element = Shade({
  shadowDomName: 'shade-generic-editor',
  render: ({ props, injector, useObservable }) => {
    const { service, basePath, columns, headerComponents, rowComponents, styles, schemaInfo } = props

    const refresh = () => service.findOptions.setValue({ ...service.findOptions.getValue() })

    const noty = injector.getInstance(NotyService)
    const locationService = injector.getInstance(LocationService)

    const [currentPath] = useObservable('locationPath', locationService.onLocationPathChanged)

    const navigate = (path: string) => {
      locationService.navigate(path)
    }

    const navigateToEdit = (id: string) => navigate(compileRoute(`${basePath}/edit/:id`, { id }))

    const editMatcher = match<{ id: string }>(`${basePath}/edit/:id`)
    const createMatcher = match(`${basePath}/create`)

    const editResult = editMatcher(currentPath)

    if (editResult) {
      const currentId = editResult.params.id as EntityFromProps<typeof props>[EntityKeyFromProps<typeof props>]
      return (
        <PiRatLazyLoad
          component={async () => {
            const [{ GenericMonacoEditor }, entry] = await Promise.all([
              import('./generic-monaco-editor.js'),
              service.getSingleEntry(currentId),
            ])
            return (
              <GenericMonacoEditor
                value={entry!}
                service={service}
                onSave={async (value) => {
                  try {
                    await service.patchEntry(currentId, value)
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
                schemaInfo={schemaInfo}
              />
            )
          }}
        />
      )
    }

    if (createMatcher(currentPath)) {
      return (
        <PiRatLazyLoad
          component={async () => {
            const { GenericMonacoEditor } = await import('./generic-monaco-editor.js')
            return (
              <GenericMonacoEditor
                service={service}
                schemaInfo={schemaInfo}
                value={{} as EntityFromProps<typeof props>}
                onSave={async (value) => {
                  try {
                    const response = await service.postEntry(value)
                    navigateToEdit(String(response[service.extendedOptions.keyProperty]))
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
              navigateToEdit(String(entry[service.extendedOptions.keyProperty]))
            }}
          >
            <Icon icon={icons.edit} size="small" />
          </Button>
          <Button
            title="Delete"
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
            <Icon icon={icons.trash} size="small" />
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
            navigate(`${basePath}/create`)
          }}
        >
          <Icon icon={icons.plus} />
        </Fab>
      </>
    )
  },
})
