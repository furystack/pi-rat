import { createComponent, RouteLink, Shade } from '@furystack/shades'
import { Dashboard } from 'common'
import { GenericEditor } from '../../components/generic-editor'
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service'
import { MonacoModelProvider } from '../../services/monaco-model-provider'
import dashboardSchemas from 'common/schemas/dashboard-entities.json'
import { DashboardService } from '../../components/dashboard/dashboards-service'

export const DashboardsPage = Shade({
  shadowDomName: 'shade-app-dashboards-page',
  render: ({ useDisposable, injector }) => {
    const dashboardsService = injector.getInstance(DashboardService)

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
            const result = await dashboardsService.findDashboard(findOptions)
            return result
          },
          deleteEntities: async (id) => {
            await dashboardsService.deleteDashboard(id)
          },
          getEntity: async (id) => {
            const result = dashboardsService.getDashboard(id)
            return result
          },
          patchEntity: async (id, entity) => {
            await dashboardsService.updateDashboard(id, entity)
          },
          postEntity: async (entity) => {
            const result = await dashboardsService.createDashboard(entity)
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
