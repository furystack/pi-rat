import type {
  DeleteEndpoint,
  GetCollectionEndpoint,
  GetEntityEndpoint,
  PatchEndpoint,
  PostEndpoint,
  RestApi,
} from '@furystack/rest'
import type { ServiceStatus, User } from './models'
import type { DirectoryEntry } from './models/directory-entry'
import type { Drive } from './models/drive'

export type GetDirectoryEntries = {
  url: {
    letter: string
    path: string
  }
  result: { files: DirectoryEntry[] }
}

export interface PiratApi extends RestApi {
  GET: {
    '/serviceStatus': { result: { state: ServiceStatus } }
    '/isAuthenticated': { result: { isAuthenticated: boolean } }
    '/currentUser': { result: User }
    '/drives': GetCollectionEndpoint<Drive>
    '/drives/:id': GetEntityEndpoint<Drive, 'letter'>
    '/drives/files/:letter/:path': GetDirectoryEntries
  }
  POST: {
    '/login': { result: User; body: { username: string; password: string } }
    '/logout': { result: unknown }
    '/install': { result: { success: boolean }; body: { username: string; password: string } }
    '/drives': PostEndpoint<Drive, 'letter'>
    '/drives/:id/upload': { result: { success: true }; body: any }
  }
  PATCH: {
    '/drives/:id': PatchEndpoint<Drive, 'letter'>
  }
  DELETE: {
    '/drives/:id': DeleteEndpoint<Drive, 'letter'>
  }
}
