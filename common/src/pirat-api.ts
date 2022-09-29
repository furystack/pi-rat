import type {
  DeleteEndpoint,
  GetCollectionEndpoint,
  GetEntityEndpoint,
  PatchEndpoint,
  PostEndpoint,
  RestApi,
} from '@furystack/rest'
import type { ServiceStatus, User } from './models'
import type { Drive } from './models/drive'

export interface PiratApi extends RestApi {
  GET: {
    '/serviceStatus': { result: { state: ServiceStatus } }
    '/isAuthenticated': { result: { isAuthenticated: boolean } }
    '/currentUser': { result: User }
    '/drives': GetCollectionEndpoint<Drive>
    '/drives/:id': GetEntityEndpoint<Drive, 'letter'>
  }
  POST: {
    '/login': { result: User; body: { username: string; password: string } }
    '/logout': { result: unknown }
    '/install': { result: { success: boolean }; body: { username: string; password: string } }
    '/drives': PostEndpoint<Drive, 'letter'>
    '/drives/:id/upload': { result: unknown; body: any }
  }
  PATCH: {
    '/drives/:id': PatchEndpoint<Drive, 'letter'>
  }
  DELETE: {
    '/drives/:id': DeleteEndpoint<Drive, 'letter'>
  }
}
