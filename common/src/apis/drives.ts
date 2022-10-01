import type {
  DeleteEndpoint,
  GetCollectionEndpoint,
  GetEntityEndpoint,
  PatchEndpoint,
  PostEndpoint,
  RestApi,
} from '@furystack/rest'
import type { DirectoryEntry } from '../models/directory-entry'
import type { Drive } from '../models/drive'

export type GetDirectoryEntries = {
  url: {
    letter: string
    path: string
  }
  result: { files: DirectoryEntry[] }
}

export interface DrivesApi extends RestApi {
  GET: {
    '/': GetCollectionEndpoint<Drive>
    '/:id': GetEntityEndpoint<Drive, 'letter'>
    '/files/:letter/:path': GetDirectoryEntries
  }
  POST: {
    '/': PostEndpoint<Drive, 'letter'>
    '/:id/upload': { result: { success: true }; body: any }
  }
  PATCH: {
    '/:id': PatchEndpoint<Drive, 'letter'>
  }
  DELETE: {
    '/:id': DeleteEndpoint<Drive, 'letter'>
  }
}
