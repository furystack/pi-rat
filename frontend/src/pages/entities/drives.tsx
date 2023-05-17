import { createComponent, Shade } from '@furystack/shades'
import { Drive } from 'common'
import { GenericEditor } from '../../components/generic-editor/index.js'
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service.js'
import { MonacoModelProvider } from '../../services/monaco-model-provider.js'
import { DrivesService } from '../../services/drives-service.js'
import drivesSchemas from 'common/schemas/drives-entities.json'

export const DrivesPage = Shade({
  shadowDomName: 'shade-app-drives-page',
  render: ({ useDisposable, injector }) => {
    const drivesService = injector.getInstance(DrivesService)

    const modelProvider = injector.getInstance(MonacoModelProvider)

    const model = modelProvider.getModelForEntityType({
      schemaName: 'Drive',
      jsonSchema: { ...drivesSchemas, type: 'object', $ref: '#/definitions/Drive' },
    })

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          defaultSettings: {},
          model: Drive,
          keyProperty: 'letter',
          readonlyProperties: ['createdAt', 'updatedAt'],
          loader: async (findOptions) => {
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
        model={model}
      />
    )
  },
})
