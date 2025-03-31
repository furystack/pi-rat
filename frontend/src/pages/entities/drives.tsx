import { createComponent, Shade } from '@furystack/shades'
import { Drive } from 'common'
import drivesSchemas from 'common/schemas/drives-entities.json' with { type: 'json' }
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service.js'
import { GenericEditor } from '../../components/generic-editor/index.js'
import { DrivesService } from '../../services/drives-service.js'
import { MonacoModelProvider } from '../../services/monaco-model-provider.js'

export const DrivesPage = Shade({
  shadowDomName: 'shade-app-drives-page',
  render: ({ useDisposable, injector }) => {
    const drivesService = injector.getInstance(DrivesService)

    const modelProvider = injector.getInstance(MonacoModelProvider)

    const modelUri = modelProvider.getModelUriForEntityType({
      schemaName: 'Drive',
      jsonSchema: { ...drivesSchemas, type: 'object', $ref: '#/definitions/Drive' },
    })

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          model: Drive,
          keyProperty: 'letter',
          readonlyProperties: ['createdAt', 'updatedAt'],
          getEntities: async (findOptions) => {
            const result = await drivesService.getVolumes({ findOptions })
            return result
          },
          deleteEntities: async (id) => {
            await drivesService.removeVolume(id)
          },
          getEntity: async (id) => {
            const result = await drivesService.getVolume(id)
            return result
          },
          patchEntity: async (id, entity) => {
            await drivesService.updateVolume(id, entity)
          },
          postEntity: async (entity) => {
            const { result } = await drivesService.addVolume(entity)
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
        modelUri={modelUri}
      />
    )
  },
})
