import type {
  DeleteEndpoint,
  GetCollectionEndpoint,
  GetCollectionResult,
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
  result: GetCollectionResult<DirectoryEntry>
}

export type UploadEndpoint = {
  result: { success: true; entries: DirectoryEntry[] }
  url: {
    letter: string
    path: string
  }
}

export interface DrivesApi extends RestApi {
  GET: {
    '/volumes': GetCollectionEndpoint<Drive>
    '/volumes/:id': GetEntityEndpoint<Drive, 'letter'>
    '/files/:letter/:path': GetDirectoryEntries
  }
  POST: {
    '/volumes': PostEndpoint<Drive, 'letter'>
    '/volumes/:letter/:path/upload': UploadEndpoint
  }
  PATCH: {
    '/volumes/:id': PatchEndpoint<Drive, 'letter'>
  }
  DELETE: {
    '/volumes/:id': DeleteEndpoint<Drive, 'letter'>
  }
}
