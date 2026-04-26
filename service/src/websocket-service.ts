import { IdentityContext, type User } from '@furystack/core'
import type { AsyncToken, Injector } from '@furystack/inject'
import { defineServiceAsync } from '@furystack/inject'
import { HttpUserContext } from '@furystack/rest-service'
import { useWebSocketApi } from '@furystack/websocket-api'
import { usingAsync } from '@furystack/utils'
import type { WebsocketMessage } from 'common'
import { getPort } from './get-port.js'

export interface WebsocketService {
  announce(
    message: WebsocketMessage,
    shouldAnnounce?: (options: { injector: Injector }) => Promise<boolean>,
  ): Promise<void>
}

export const WebsocketService: AsyncToken<WebsocketService, 'singleton'> = defineServiceAsync({
  name: 'pi-rat/WebsocketService',
  lifetime: 'singleton',
  factory: async ({ injector }) => {
    const api = await useWebSocketApi({
      injector,
      port: getPort(),
      path: '/api/ws',
    })
    return {
      announce: async (
        message: WebsocketMessage,
        shouldAnnounce: (options: { injector: Injector }) => Promise<boolean> = async () => true,
      ) => {
        await api.broadcast(async (options) => {
          await usingAsync(options.injector.createScope({ owner: options.message }), async (scope) => {
            // The broadcast injector lacks IdentityContext (it's only bound per-message),
            // so derive it from the upgrade request to allow auth-aware filters.
            scope.bind(IdentityContext, () => {
              const httpUserContext = scope.get(HttpUserContext)
              return {
                getCurrentUser: <TUser extends User>() =>
                  httpUserContext.getCurrentUser(options.message) as Promise<TUser>,
                isAuthorized: (...roles) => httpUserContext.isAuthorized(options.message, ...roles),
                isAuthenticated: () => httpUserContext.isAuthenticated(options.message),
              }
            })
            try {
              if (await shouldAnnounce({ injector: scope })) {
                // ws types are not resolved by eslint
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                options.ws.send(JSON.stringify(message))
              }
            } catch {
              // Ignore, maybe injector is already in a disposed state
            }
          })
        })
      },
    }
  },
})
