import type { ChildrenList } from '@furystack/shades'
import { createComponent, LocationService, Shade } from '@furystack/shades'
import type { CollectionService, DataGridProps } from '@furystack/shades-common-components'
import { NotyService } from '@furystack/shades-common-components'
import { Button, SelectionCell } from '@furystack/shades-common-components'
import { Fab } from '@furystack/shades-common-components'
import { DataGrid } from '@furystack/shades-common-components'
import type { GenericEditorService } from './generic-editor-service'
import type monaco from 'monaco-editor'
import { GenericMonacoEditor } from './generic-monaco-editor'
import { PiRatLazyLoad } from '../pirat-lazy-load'

type GenericEditorProps<T, TKey extends keyof T, TReadonlyProperties extends keyof T> = {
  service: GenericEditorService<T, TKey, TReadonlyProperties>
  columns: DataGridProps<T>['columns']
  headerComponents: DataGridProps<T>['headerComponents']
  rowComponents: DataGridProps<T>['rowComponents']
  styles: DataGridProps<T>['styles']
  model?: monaco.editor.ITextModel
}

export const GenericEditor: <T, TKey extends keyof T, TReadonlyProperties extends keyof T>(
  props: GenericEditorProps<T, TKey, TReadonlyProperties>,
  childrenList: ChildrenList,
) => JSX.Element = Shade({
  shadowDomName: 'shade-generic-editor',
  render: ({ props, injector, useObservable }) => {
    const { service, columns, headerComponents, rowComponents, styles, model } = props

    const refresh = () => service.querySettings.setValue({ ...service.querySettings.getValue() })

    const noty = injector.getInstance(NotyService)

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
        <PiRatLazyLoad
          component={async () => {
            const entry = await service.getSingleEntry(currentId as any)
            return (
              <GenericMonacoEditor
                value={entry}
                onSave={async (value) => {
                  try {
                    await service.patchEntry(currentId as any, value)
                    noty.addNoty({ type: 'success', title: 'Entity updated', body: 'Entity updated successfully' })
                    refresh()
                  } catch (error) {
                    noty.addNoty({ type: 'error', title: 'Failed to update entity', body: (error as Error).toString() })
                  }
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
            try {
              const response = await service.postEntry(value)
              setMode('edit')
              setCurrentId(response[service.extendedOptions.keyProperty] as string)
              noty.addNoty({ type: 'success', title: 'Entity created', body: 'Entity created successfully' })
              refresh()
            } catch (error) {
              noty.addNoty({ type: 'error', title: 'Failed to create entity', body: (error as Error).toString() })
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
                    setMode('edit')
                    setCurrentId(entry[service.extendedOptions.keyProperty] as string)
                    refresh()
                  }}>
                  ✏️
                </Button>
                <Button
                  onclick={() => {
                    service
                      .removeEntries(entry[service.extendedOptions.keyProperty] as any)
                      .then(() => {
                        noty.addNoty({ type: 'success', title: 'Entity deleted', body: 'Entity deleted successfully' })
                        refresh()
                      })
                      .catch((error) => {
                        noty.addNoty({
                          type: 'error',
                          title: 'Failed to delete entity',
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
            setMode('create')
          }}>
          ➕
        </Fab>
      </>
    )
  },
})
