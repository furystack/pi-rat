import type { Injector } from '@furystack/inject'
import '@furystack/repository'
import {
  createDeleteEndpoint,
  createGetCollectionEndpoint,
  createGetEntityEndpoint,
  createPatchEndpoint,
  createPostEndpoint,
  useRestService,
  Validate,
} from '@furystack/rest-service'
import type { DrivesApi } from 'common'
import { Drive } from 'common'
import drivesApiSchema from 'common/schemas/drives-api.json' with { type: 'json' }
import { getCorsOptions } from '../../get-cors-options.js'
import { getPort } from '../../get-port.js'
import { DeleteFileAction } from './actions/delete-file-action.js'
import { DownloadAction } from './actions/download-action.js'
import { FfprobeAction } from './actions/ffprobe-action.js'
import { GetDirectoryEntriesAction } from './actions/get-directory-entries.js'
import { SaveTextFileAction } from './actions/save-text-file-action.js'
import { UploadAction } from './actions/upload-action.js'

export const setupDrivesRestApi = async (injector: Injector) => {
  await useRestService<DrivesApi>({
    injector,
    root: 'api/drives',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/volumes/:id': Validate({
          schema: drivesApiSchema,
          schemaName: 'GetEntityEndpoint<Drive,"letter">',
        })(
          createGetEntityEndpoint({
            model: Drive,
            primaryKey: 'letter',
          }),
        ),
        '/volumes': Validate({
          schema: drivesApiSchema,
          schemaName: 'GetCollectionEndpoint<Drive>',
        })(
          createGetCollectionEndpoint({
            model: Drive,
            primaryKey: 'letter',
          }),
        ),
        '/files/:letter/:path': Validate({ schema: drivesApiSchema, schemaName: 'GetDirectoryEntries' })(
          GetDirectoryEntriesAction,
        ),
        '/files/:letter/:path/download': DownloadAction,
        '/files/:letter/:path/ffprobe': Validate({ schema: drivesApiSchema, schemaName: 'FfprobeEndpoint' })(
          FfprobeAction,
        ),
      },
      POST: {
        '/volumes/:letter/:path/upload': UploadAction,
        '/volumes': Validate({ schema: drivesApiSchema, schemaName: 'PostDriveEndpoint' })(
          createPostEndpoint({
            model: Drive,
            primaryKey: 'letter',
          }),
        ),
      },
      PATCH: {
        '/volumes/:id': Validate({ schema: drivesApiSchema, schemaName: 'PatchDriveEndpoint' })(
          createPatchEndpoint({
            model: Drive,
            primaryKey: 'letter',
          }),
        ),
      },
      PUT: {
        '/files/:letter/:path': Validate({ schema: drivesApiSchema, schemaName: 'SaveTextFileEndpoint' })(
          SaveTextFileAction,
        ),
      },
      DELETE: {
        '/volumes/:id': createDeleteEndpoint({
          model: Drive,
          primaryKey: 'letter',
        }),
        '/files/:letter/:path': DeleteFileAction,
      },
    },
  })
}
