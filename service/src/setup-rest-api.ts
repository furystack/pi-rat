import { PiratApi, User } from 'common'
import {
  createDeleteEndpoint,
  createGetCollectionEndpoint,
  createGetEntityEndpoint,
  createPatchEndpoint,
  createPostEndpoint,
  DefaultSession,
  GetCurrentUser,
  IsAuthenticated,
  LoginAction,
  LogoutAction,
  useHttpAuthentication,
  useRestService,
  Validate,
} from '@furystack/rest-service'
import '@furystack/repository'
import { GetServiceStatusAction } from './actions/get-service-status'
import { PostInstallAction } from './actions/post-install-action'
import { getLogger } from '@furystack/logging'
import { Drive, PiratApiSchemas } from 'common'
import { Injector } from '@furystack/inject'

export const setupRestApi = async (injector: Injector) => {
  const restApiLogger = getLogger(injector).withScope('service')

  restApiLogger.information({ message: '⚙️  Starting REST API...' })

  const port = parseInt(process.env.APP_SERVICE_PORT as string, 10) || 9090

  useHttpAuthentication(injector, {
    getUserStore: (sm) => sm.getStoreFor<User & { password: string }, 'username'>(User as any, 'username'),
    getSessionStore: (sm) => sm.getStoreFor(DefaultSession, 'sessionId'),
  })

  await useRestService<PiratApi>({
    injector,
    root: 'api',
    port,
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
        '/drives': Validate({
          schema: PiratApiSchemas,
          schemaName: 'GetCollectionEndpoint<Drive>',
        })(
          createGetCollectionEndpoint({
            model: Drive,
            primaryKey: 'letter',
          }),
        ),
        '/drives/:id': Validate({
          schema: PiratApiSchemas,
          schemaName: 'GetEntityEndpoint<Drive,"letter">',
        })(
          createGetEntityEndpoint({
            model: Drive,
            primaryKey: 'letter',
          }),
        ),
      },
      POST: {
        '/login': LoginAction,
        '/logout': LogoutAction,
        '/install': PostInstallAction,
        '/drives': Validate({ schema: PiratApiSchemas, schemaName: 'PostEndpoint<Drive>' })(
          createPostEndpoint({
            model: Drive,
            primaryKey: 'letter',
          }),
        ),
      },
      PATCH: {
        '/drives/:id': createPatchEndpoint({
          model: Drive,
          primaryKey: 'letter',
        }),
      },
      DELETE: {
        '/drives/:id': createDeleteEndpoint({
          model: Drive,
          primaryKey: 'letter',
        }),
      },
    },
  })
  restApiLogger.information({ message: `✅ PI-RAT service is listening on port ${port}` })
}
