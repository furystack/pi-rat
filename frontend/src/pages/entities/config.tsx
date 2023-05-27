import { createComponent, Shade } from '@furystack/shades'
import { Config } from 'common'
import configSchemas from 'common/schemas/config-entities.json'
import { GenericEditor } from '../../components/generic-editor/index.js'
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service.js'
import { ConfigApiClient } from '../../services/api-clients/config-api-client.js'
import { MonacoModelProvider } from '../../services/monaco-model-provider.js'

export const ConfigPage = Shade({
  shadowDomName: 'shade-app-configs-page',
  render: ({ useDisposable, injector }) => {
    const api = injector.getInstance(ConfigApiClient)

    const modelProvider = injector.getInstance(MonacoModelProvider)

    const model = modelProvider.getModelForEntityType({
      schemaName: 'Config',
      jsonSchema: { ...configSchemas, type: 'object', $ref: '#/definitions/Config' },
    })

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          defaultSettings: {},
          model: Config,
          keyProperty: 'id',
          readonlyProperties: ['createdAt', 'updatedAt'],
          loader: async (findOptions) => {
            const result = await api.call({
              method: 'GET',
              action: '/config',
              query: { findOptions },
            })
            return result.result
          },
          deleteEntities: async (id) => {
            await api.call({ method: 'DELETE', action: `/config/:id`, url: { id } })
          },
          getEntity: async (id) => {
            const result = await api.call({ method: 'GET', action: `/config/:id`, url: { id }, query: {} })
            return result.result
          },
          patchEntity: async (id, entity) => {
            await api.call({
              method: 'PATCH',
              action: `/config/:id`,
              url: { id },
              body: entity,
            })
          },
          postEntity: async (entity) => {
            const { result } = await api.call({
              method: 'POST',
              action: `/config`,
              body: {
                id: entity.id,
                value: entity.value,
              },
            })
            return result
          },
        }),
    )
    return (
      <GenericEditor
        service={service}
        columns={['id', 'value', 'createdAt', 'updatedAt']}
        headerComponents={{}}
        styles={{}}
        rowComponents={{}}
        model={model}
      />
    )
  },
})
