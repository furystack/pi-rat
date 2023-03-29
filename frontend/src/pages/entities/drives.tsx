import { createComponent, Shade } from '@furystack/shades'
import { Drive } from 'common'
import { GenericEditor } from '../../components/generic-editor'
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service'
import { DrivesApiClient } from '../../services/drives-api-client'
import { MonacoModelProvider } from '../../services/monaco-model-provider'
import { drivesSchemas } from 'common'

export const DrivesPage = Shade({
  shadowDomName: 'shade-app-drives-page',
  render: ({ useDisposable, injector }) => {
    const api = injector.getInstance(DrivesApiClient)

    const modelProvider = injector.getInstance(MonacoModelProvider)

    const model = modelProvider.getModelForEntityType({
      schemaName: 'Drive',
      jsonSchema: drivesSchemas.definitions.Drive,
    })

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          defaultSettings: {},
          model: Drive,
          keyProperty: 'letter',
          readonlyProperties: ['createdAt', 'updatedAt', 'letter'],
          loader: async (findOptions) => {
            const result = await api.call({
              method: 'GET',
              action: '/volumes',
              query: { findOptions },
            })
            return result.result
          },
          deleteEntities: async (id) => {
            await api.call({ method: 'DELETE', action: `/volumes/:id`, url: { id } })
          },
          getEntity: async (id) => {
            const result = await api.call({ method: 'GET', action: `/volumes/:id`, url: { id }, query: {} })
            return result.result
          },
          patchEntity: async (id, entity) => {
            await api.call({
              method: 'PATCH',
              action: `/volumes/:id`,
              url: { id },
              body: entity,
            })
          },
          postEntity: async (entity) => {
            const { result } = await api.call({
              method: 'POST',
              action: `/volumes`,
              body: entity,
            })
            return result
          },
        }),
    )
    return (
      <GenericEditor
        service={service}
        columns={['letter', 'physicalPath']}
        headerComponents={{}}
        styles={{}}
        rowComponents={{}}
        model={model}
      />
    )
  },
})
