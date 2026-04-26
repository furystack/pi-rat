import { isAuthorized } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import {
  Validate,
  createDeleteEndpoint,
  createGetCollectionEndpoint,
  createGetEntityEndpoint,
  createPatchEndpoint,
  createPostEndpoint,
  useRestService,
  type RequestAction,
} from '@furystack/rest-service'
import type { IotApi, PatchDeviceEndpoint } from 'common'
import iotApiSchema from 'common/schemas/iot-api.json' with { type: 'json' }
import { getCorsOptions } from '../../get-cors-options.js'
import { getPort } from '../../get-port.js'
import { WebsocketService } from '../../websocket-service.js'
import { AwakeAction } from './actions/awake-action.js'
import { PingAction } from './actions/ping-action.js'
import { DeviceAvailabilityHub } from './device-availability-hub.js'
import { DeviceAwakeHistoryDataSet, DeviceDataSet, DevicePingHistoryDataSet } from './setup-store.js'

export const setupIotApi = async (injector: Injector) => {
  await useRestService<IotApi>({
    injector,
    root: 'api/iot',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/devices': Validate({ schema: iotApiSchema, schemaName: 'GetCollectionEndpoint<Device>' })(
          createGetCollectionEndpoint(DeviceDataSet),
        ),
        '/devices/:id': Validate({ schema: iotApiSchema, schemaName: 'GetEntityEndpoint<Device,"name">' })(
          createGetEntityEndpoint(DeviceDataSet),
        ),
        '/device-awake-history': Validate({
          schema: iotApiSchema,
          schemaName: 'GetCollectionEndpoint<DeviceAwakeHistory>',
        })(createGetCollectionEndpoint(DeviceAwakeHistoryDataSet)),
        '/device-ping-history': Validate({
          schema: iotApiSchema,
          schemaName: 'GetCollectionEndpoint<DevicePingHistory>',
        })(createGetCollectionEndpoint(DevicePingHistoryDataSet)),
      },
      POST: {
        '/devices': Validate({ schema: iotApiSchema, schemaName: 'PostDeviceEndpoint' })(
          createPostEndpoint(DeviceDataSet),
        ),
        '/devices/:id/awake': Validate({ schema: iotApiSchema, schemaName: 'AwakeEndpoint' })(AwakeAction),
        '/devices/:id/ping': Validate({ schema: iotApiSchema, schemaName: 'PingEndpoint' })(PingAction),
      },
      PATCH: {
        '/devices/:id': Validate({ schema: iotApiSchema, schemaName: 'PatchDeviceEndpoint' })(
          createPatchEndpoint(DeviceDataSet) as RequestAction<PatchDeviceEndpoint>,
        ),
      },
      DELETE: {
        '/devices/:id': Validate({ schema: iotApiSchema, schemaName: 'DeleteEndpoint<Device,"name">' })(
          createDeleteEndpoint(DeviceDataSet),
        ),
      },
    },
  })

  const hub = injector.get(DeviceAvailabilityHub)
  const ws = await injector.getAsync(WebsocketService)

  hub.subscribe('connected', (device) => {
    void ws.announce({ type: 'device-connected', device }, (options) => isAuthorized(options.injector, 'admin'))
  })

  hub.subscribe('disconnected', (device) => {
    void ws.announce({ type: 'device-disconnected', device }, async (options) =>
      isAuthorized(options.injector, 'admin'),
    )
  })
}
