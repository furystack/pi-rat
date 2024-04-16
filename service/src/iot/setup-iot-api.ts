import type { Injector } from '@furystack/inject'
import {
  Validate,
  createGetCollectionEndpoint,
  createGetEntityEndpoint,
  createPatchEndpoint,
  createPostEndpoint,
  useRestService,
} from '@furystack/rest-service'
import { getCorsOptions } from '../get-cors-options.js'
import { getPort } from '../get-port.js'
import type { IotApi } from 'common'
import iotApiSchema from 'common/schemas/iot-api.json' assert { type: 'json' }
import { Device, DeviceAwakeHistory, DevicePingHistory } from 'common'
import { AwakeAction } from './actions/awake-action.js'
import { PingAction } from './actions/ping-action.js'
import { WebSocketApi, useWebsockets } from '@furystack/websocket-api'
import { DeviceAvailabilityHub } from './device-availability-hub.js'
import { isAuthorized } from '@furystack/core'

export const setupIotApi = async (injector: Injector) => {
  await useRestService<IotApi>({
    injector,
    root: 'api/iot',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/devices': Validate({ schema: iotApiSchema, schemaName: 'GetCollectionEndpoint<Device>' })(
          createGetCollectionEndpoint({ model: Device, primaryKey: 'name' }),
        ),
        '/devices/:id': Validate({ schema: iotApiSchema, schemaName: 'GetEntityEndpoint<Device,"name">' })(
          createGetEntityEndpoint({ model: Device, primaryKey: 'name' }),
        ),
        '/device-awake-history': Validate({
          schema: iotApiSchema,
          schemaName: 'GetCollectionEndpoint<DeviceAwakeHistory>',
        })(createGetCollectionEndpoint({ model: DeviceAwakeHistory, primaryKey: 'id' })),
        '/device-ping-history': Validate({
          schema: iotApiSchema,
          schemaName: 'GetCollectionEndpoint<DevicePingHistory>',
        })(createGetCollectionEndpoint({ model: DevicePingHistory, primaryKey: 'id' })),
      },
      POST: {
        '/devices': Validate({ schema: iotApiSchema, schemaName: 'PostDeviceEndpoint' })(
          createPostEndpoint({ model: Device, primaryKey: 'name' }),
        ),
        '/devices/:id/awake': Validate({ schema: iotApiSchema, schemaName: 'AwakeEndpoint' })(AwakeAction),
        '/devices/:id/ping': Validate({ schema: iotApiSchema, schemaName: 'PingEndpoint' })(PingAction),
      },
      PATCH: {
        '/devices/:id': Validate({
          schema: iotApiSchema,
          schemaName: 'PatchDeviceEndpoint',
        })(
          createPatchEndpoint({
            model: Device,
            primaryKey: 'name',
          }),
        ),
      },
      DELETE: {
        '/devices/:id': Validate({ schema: iotApiSchema, schemaName: 'DeleteEndpoint<Device,"name">' })(
          createPatchEndpoint({
            model: Device,
            primaryKey: 'name',
          }),
        ),
      },
    },
  })

  await useWebsockets(injector, {
    port: getPort(),
    path: '/api/ws',
  })

  const hub = injector.getInstance(DeviceAvailabilityHub)
  const ws = injector.getInstance(WebSocketApi)

  hub.subscribe('connected', async (device) => {
    ws.broadcast(async (options) => {
      const shouldNotify = await isAuthorized(options.injector, 'admin')
      if (shouldNotify) {
        options.ws.send(JSON.stringify({ type: 'device-connected', device }))
      }
    })
  })

  hub.subscribe('disconnected', async (device) => {
    ws.broadcast(async (options) => {
      const shouldNotify = await isAuthorized(options.injector, 'admin')
      if (shouldNotify) {
        options.ws.send(JSON.stringify({ type: 'device-disconnected', device }))
      }
    })
  })
}
