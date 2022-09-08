import { PiratApi, User } from 'common'
import {
  DefaultSession,
  GetCurrentUser,
  IsAuthenticated,
  LoginAction,
  LogoutAction,
  useHttpAuthentication,
  useRestService,
} from '@furystack/rest-service'
import '@furystack/repository'
import { injector } from './config'
import { attachShutdownHandler } from './shutdown-handler'
import { GetServiceStatusAction } from './actions/get-service-status'
import { PostInstallAction } from './actions/post-install-action'

useHttpAuthentication(injector, {
  getUserStore: (sm) => sm.getStoreFor<User & { password: string }, 'username'>(User as any, 'username'),
  getSessionStore: (sm) => sm.getStoreFor(DefaultSession, 'sessionId'),
})
useRestService<PiratApi>({
  injector,
  root: 'api',
  port: parseInt(process.env.APP_SERVICE_PORT as string, 10) || 9090,
  cors: {
    credentials: true,
    origins: ['http://localhost:8080'],
    headers: ['cache', 'content-type'],
  },
  api: {
    GET: {
      '/currentUser': GetCurrentUser,
      '/isAuthenticated': IsAuthenticated,
      '/serviceStatus': GetServiceStatusAction,
    },
    POST: {
      '/login': LoginAction,
      '/logout': LogoutAction,
      '/install': PostInstallAction,
    },
  },
}).catch((err) => {
  console.error(err)
  process.exit(1)
})

attachShutdownHandler(injector)
