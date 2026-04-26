import type { AsyncToken, Injector } from '@furystack/inject'
import { defineServiceAsync } from '@furystack/inject'
import { useWebSocketApi } from '@furystack/websocket-api'
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
          try {
            if (await shouldAnnounce(options)) {
              // ws types are not resolved by eslint
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              options.ws.send(JSON.stringify(message))
            }
          } catch {
            // Ignore, maybe injector is already in a disposed state
          }
        })
      },
    }
  },
})
