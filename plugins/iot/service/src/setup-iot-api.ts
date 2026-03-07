import { isAuthorized } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import {
  Validate,
  createGetCollectionEndpoint,
  createGetEntityEndpoint,
  createPatchEndpoint,
  createPostEndpoint,
  useRestService,
} from '@furystack/rest-service'
import { Device, DeviceAwakeHistory, DevicePingHistory, type IotApi } from '@pi-rat/iot-common'
import iotApiSchema from '@pi-rat/iot-common/schemas/iot-api.json' with { type: 'json' }
import { AwakeAction } from './actions/awake-action.js'
import { PingAction } from './actions/ping-action.js'
import { DeviceAvailabilityHub } from './device-availability-hub.js'

export type IotApiSetupOptions = {
  port: number
  cors: { origins: string[] }
  announce: (message: unknown, filter?: (options: { injector: Injector }) => Promise<boolean>) => Promise<void>
}

export const setupIotApi = async (injector: Injector, options: IotApiSetupOptions) => {
  await useRestService<IotApi>({
    injector,
    root: 'api/iot',
    port: options.port,
    cors: options.cors,
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

  const hub = injector.getInstance(DeviceAvailabilityHub)

  hub.subscribe('connected', (device) => {
    void options.announce({ type: 'device-connected', device }, (opts) => isAuthorized(opts.injector, 'admin'))
  })

  hub.subscribe('disconnected', (device) => {
    void options.announce({ type: 'device-disconnected', device }, async (opts) => isAuthorized(opts.injector, 'admin'))
  })
}
