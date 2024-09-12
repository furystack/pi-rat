import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import { useWebsockets, WebSocketApi } from '@furystack/websocket-api'
import type { WebsocketMessage } from 'common'
import { getPort } from './get-port.js'

@Injectable({ lifetime: 'singleton' })
export class WebsocketService {
  @Injected((injector) => {
    useWebsockets(injector, {
      port: getPort(),
      path: '/api/ws',
    })
    return injector.getInstance(WebSocketApi)
  })
  private declare webSocketApi: WebSocketApi

  public announce = async (
    message: WebsocketMessage,
    shouldAnnounce: (options: { injector: Injector }) => Promise<boolean> = async () => true,
  ) => {
    await this.webSocketApi.broadcast(async (options) => {
      if (await shouldAnnounce(options)) {
        // ws types are not resolved by eslint
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        options.ws.send(JSON.stringify(message))
      }
    })
  }
}
