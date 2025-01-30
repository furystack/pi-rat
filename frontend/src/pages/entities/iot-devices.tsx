import { createComponent, Shade } from '@furystack/shades'
import { Device } from 'common'
import iotSchemas from 'common/schemas/iot-entities.json' assert { type: 'json' }
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service.js'
import { GenericEditor } from '../../components/generic-editor/index.js'
import { IotDevicesService } from '../../services/iot-devices-service.js'
import { MonacoModelProvider } from '../../services/monaco-model-provider.js'

export const IotDevicesPage = Shade({
  shadowDomName: 'shade-app-iot-devices-page',
  render: ({ useDisposable, injector }) => {
    const iotService = injector.getInstance(IotDevicesService)

    const modelProvider = injector.getInstance(MonacoModelProvider)

    const modelUri = modelProvider.getModelUriForEntityType({
      schemaName: 'IotDevicesService',
      jsonSchema: { ...iotSchemas, type: 'object', $ref: '#/definitions/Device' },
    })

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          model: Device,
          keyProperty: 'name',
          readonlyProperties: [],
          deleteEntities: async (...entities) => {
            // TODO: Bulk?
            await Promise.all(entities.map((entity) => iotService.deleteDevice(entity)))
          },
          getEntity: async (id) => {
            const result = await iotService.getDevice(id)
            return result
          },
          getEntities: async (findOptions) => {
            const result = await iotService.findDevice(findOptions)
            return result
          },
          patchEntity: async (key, update) => {
            await iotService.updateDevice(key, update)
          },
          postEntity: async (entity) => {
            const result = await iotService.addDevice(entity)
            return result.response.body as unknown as Device
          },
        }),
    )
    return (
      <GenericEditor
        service={service}
        columns={['name', 'ipAddress', 'macAddress', 'updatedAt']}
        headerComponents={{}}
        styles={{}}
        rowComponents={{}}
        modelUri={modelUri}
      />
    )
  },
})
