import type { DrivesApi } from 'common'
import {
  createDeleteEndpoint,
  createGetCollectionEndpoint,
  createGetEntityEndpoint,
  createPatchEndpoint,
  createPostEndpoint,
  useRestService,
  Validate,
} from '@furystack/rest-service'
import '@furystack/repository'
import { Drive, drivesApiSchema } from 'common'
import type { Injector } from '@furystack/inject'
import { GetDirectoryEntriesAction } from './actions/get-directory-entries'
import { getPort } from '../get-port'
import { getCorsOptions } from '../get-cors-options'
import { UploadAction } from './actions/upload-action'
import { DeleteFileAction } from './actions/delete-file-action'
import { DownloadAction } from './actions/download-action'

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
      },
      POST: {
        '/volumes/:letter/:path/upload': UploadAction,
        '/volumes': Validate({ schema: drivesApiSchema, schemaName: 'PostEndpoint<Drive,"letter">' })(
          createPostEndpoint({
            model: Drive,
            primaryKey: 'letter',
          }),
        ),
      },
      PATCH: {
        '/volumes/:id': createPatchEndpoint({
          model: Drive,
          primaryKey: 'letter',
        }),
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
