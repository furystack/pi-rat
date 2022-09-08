import { RestApi } from '@furystack/rest'
import { ServiceStatus, User } from './models'
export interface PiratApi extends RestApi {
  GET: {
    '/serviceStatus': { result: { state: ServiceStatus } }
    '/isAuthenticated': { result: { isAuthenticated: boolean } }
    '/currentUser': { result: User }
  }
  POST: {
    '/login': { result: User; body: { username: string; password: string } }
    '/logout': { result: unknown }
    '/install': { result: { success: boolean }; body: { username: string; password: string } }
  }
}
