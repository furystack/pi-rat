import { createComponent, Shade } from '@furystack/shades'
import { AppLink } from '../../routes/index.js'
import { Dashboard } from 'common'
import dashboardSchemas from 'common/schemas/dashboard-entities.json' with { type: 'json' }
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service.js'
import { GenericEditor } from '../../components/generic-editor/index.js'
import { DashboardService } from '../../services/dashboards-service.js'

export const DashboardsPage = Shade({
  customElementName: 'shade-app-dashboards-page',
  render: ({ useDisposable, injector }) => {
    const dashboardsService = injector.get(DashboardService)

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          model: Dashboard,
          keyProperty: 'id',
          readonlyProperties: ['createdAt', 'updatedAt'],
          getEntities: async (findOptions) => {
            const result = await dashboardsService.findDashboard(findOptions)
            return result
          },
          deleteEntities: async (...ids) => {
            await Promise.all(ids.map((id) => dashboardsService.deleteDashboard(id)))
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
        basePath="/entities/dashboards"
        columns={['name', 'description', 'createdAt', 'updatedAt', 'id']}
        headerComponents={{
          id: () => <>Preview</>,
        }}
        styles={{}}
        rowComponents={{
          id: ({ id }) => {
            return (
              <AppLink path="/dashboards/:id" params={{ id }}>
                Preview
              </AppLink>
            )
          },
        }}
        schemaInfo={{
          schemaName: 'Dashboard',
          jsonSchema: { ...dashboardSchemas, type: 'object', $ref: '#/definitions/Dashboard' },
        }}
      />
    )
  },
})
