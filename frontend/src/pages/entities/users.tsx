import { createComponent, Shade } from '@furystack/shades'
import { User } from 'common'
import identitySchemas from 'common/schemas/identity-entities.json'
import { GenericEditor } from '../../components/generic-editor/index.js'
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service.js'
import { IdentityApiClient } from '../../services/api-clients/identity-api-client.js'
import { MonacoModelProvider } from '../../services/monaco-model-provider.js'

export const UsersPage = Shade({
  shadowDomName: 'shade-app-users-page',
  render: ({ useDisposable, injector }) => {
    const api = injector.getInstance(IdentityApiClient)

    const modelProvider = injector.getInstance(MonacoModelProvider)

    const modelUri = modelProvider.getModelUriForEntityType({
      schemaName: 'User',
      jsonSchema: { ...identitySchemas, type: 'object', $ref: '#/definitions/User' },
    })

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          model: User,
          keyProperty: 'username',
          readonlyProperties: ['createdAt', 'updatedAt'],
          getEntities: async (findOptions) => {
            const result = await api.call({
              method: 'GET',
              action: '/users',
              query: { findOptions },
            })
            return result.result
          },
          deleteEntities: async (id) => {
            await api.call({ method: 'DELETE', action: `/users/:id`, url: { id } })
          },
          getEntity: async (id) => {
            const result = await api.call({ method: 'GET', action: `/users/:id`, url: { id }, query: {} })
            return result.result
          },
          patchEntity: async (id, entity) => {
            await api.call({
              method: 'PATCH',
              action: `/users/:id`,
              url: { id },
              body: entity,
            })
          },
          postEntity: async (entity) => {
            const { result } = await api.call({
              method: 'POST',
              action: `/users`,
              body: entity,
            })
            return result
          },
        }),
    )
    return (
      <GenericEditor
        service={service}
        columns={['username', 'roles']}
        headerComponents={{}}
        styles={{}}
        rowComponents={{}}
        modelUri={modelUri}
      />
    )
  },
})
