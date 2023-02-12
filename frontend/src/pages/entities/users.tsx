import { createComponent, Shade } from '@furystack/shades'
import { identityApiSchema, User } from 'common'
import { GenericEditor } from '../../components/generic-editor'
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service'
import { IdentityApiClient } from '../../services/identity-api-client'
import { MonacoModelProvider } from '../../services/monaco-model-provider'

export const UsersPage = Shade({
  shadowDomName: 'shade-app-users-page',
  render: ({ useDisposable, injector }) => {
    const api = injector.getInstance(IdentityApiClient)

    const modelProvider = injector.getInstance(MonacoModelProvider)

    const model = modelProvider.getModelForEntityType({
      schemaName: 'User',
      jsonSchema: identityApiSchema.definitions.User,
    })

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService<User, 'username'>({
          defaultSettings: {},
          keyProperty: 'username',
          loader: async (findOptions) => {
            const result = await api.call({
              method: 'GET',
              action: '/users',
              query: { findOptions },
            })
            return result.result
          },
          remover: async (id) => {
            await api.call({ method: 'DELETE', action: `/users/:id`, url: { id } })
          },
          singleLoader: async (id) => {
            const result = await api.call({ method: 'GET', action: `/users/:id`, url: { id }, query: {} })
            return result.result
          },
          updater: async (id, entity) => {
            await api.call({
              method: 'PATCH',
              action: `/users/:id`,
              url: { id },
              body: entity,
            })
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
        model={model}
      />
    )
  },
})
