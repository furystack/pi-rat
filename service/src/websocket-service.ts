import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import { WebSocketApi } from '@furystack/websocket-api'
import { useWebsockets } from '@furystack/websocket-api'
import { getPort } from './get-port.js'
import type { WebsocketMessage } from 'common'

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
    this.webSocketApi.broadcast(async (options) => {
      if (await shouldAnnounce(options)) {
        options.ws.send(JSON.stringify(message))
      }
    })
  }
}
