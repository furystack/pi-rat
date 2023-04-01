import { createComponent, RouteLink, Shade } from '@furystack/shades'
import { Dashboard } from 'common'
import { GenericEditor } from '../../components/generic-editor'
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service'
import { DashboardsApiClient } from '../../services/dashboards-api-client'
import { MonacoModelProvider } from '../../services/monaco-model-provider'
import dashboardSchemas from 'common/schemas/dashboard-entities.json'

export const DashboardsPage = Shade({
  shadowDomName: 'shade-app-dashboards-page',
  render: ({ useDisposable, injector }) => {
    const api = injector.getInstance(DashboardsApiClient)

    const modelProvider = injector.getInstance(MonacoModelProvider)

    const model = modelProvider.getModelForEntityType({
      schemaName: 'Dashboard',
      jsonSchema: { ...dashboardSchemas, type: 'object', $ref: '#/definitions/Dashboard' },
    })

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          defaultSettings: {},
          model: Dashboard,
          keyProperty: 'id',
          readonlyProperties: ['createdAt', 'updatedAt'],
          loader: async (findOptions) => {
            const result = await api.call({
              method: 'GET',
              action: '/dashboards',
              query: { findOptions },
            })
            return result.result
          },
          deleteEntities: async (id) => {
            await api.call({ method: 'DELETE', action: `/dashboards/:id`, url: { id } })
          },
          getEntity: async (id) => {
            const result = await api.call({ method: 'GET', action: `/dashboards/:id`, url: { id }, query: {} })
            return result.result
          },
          patchEntity: async (id, entity) => {
            await api.call({
              method: 'PATCH',
              action: `/dashboards/:id`,
              url: { id },
              body: entity,
            })
          },
          postEntity: async (entity) => {
            const { result } = await api.call({
              method: 'POST',
              action: `/dashboards`,
              body: entity,
            })
            return result
          },
        }),
    )
    return (
      <GenericEditor
        service={service}
        columns={['name', 'description', 'createdAt', 'updatedAt', 'id']}
        headerComponents={{
          id: () => <>Preview</>,
        }}
        styles={{}}
        rowComponents={{
          id: ({ id }) => {
            return <RouteLink href={`/dashboards/${id}`}>Preview</RouteLink>
          },
        }}
        model={model}
      />
    )
  },
})
