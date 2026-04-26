import { defineService, type Token } from '@furystack/inject'
import { useScopedLogger, type ScopedLogger } from '@furystack/logging'
import { EventHub } from '@furystack/utils'
import type { WebsocketMessage } from 'common'
import { environmentOptions } from '../utils/environment-options.js'

type WebsocketNotificationEvents = {
  onMessage: WebsocketMessage
  onInvalidMessage: [unknown]
}

class WebsocketNotificationsServiceImpl extends EventHub<WebsocketNotificationEvents> {
  private readonly wsUrl = new URL(`${environmentOptions.serviceUrl}/ws`, window.location.href)
  public socket: WebSocket

  constructor(private readonly logger: ScopedLogger) {
    super()
    this.socket = this.createSocket()
  }

  public dispose() {
    this.socket.close()
  }

  private createSocket() {
    const socket = new WebSocket(this.wsUrl.toString().replace('http', 'ws'))
    socket.onmessage = async ({ data }) => {
      if (typeof data === 'string') {
        this.emit('onMessage', JSON.parse(data) as WebsocketMessage)
      } else {
        await this.logger.warning({ message: 'Invalid message received', data })
      }
    }
    socket.onerror = async (error) => {
      await this.logger.error({ message: 'WebSocket error', data: { error } })
      this.emit('onInvalidMessage', [error])
    }

    socket.onclose = async (event) => {
      if (event.wasClean) {
        await this.logger.information({
          message: 'WebSocket connection closed cleanly',
          data: { code: event.code, reason: event.reason },
        })
      } else {
        await this.logger.error({
          message: 'WebSocket connection closed unexpectedly',
          data: { code: event.code, reason: event.reason },
        })
      }
    }
    return socket
  }
}

export type WebsocketNotificationsService = WebsocketNotificationsServiceImpl

export const WebsocketNotificationsService: Token<WebsocketNotificationsService, 'singleton'> = defineService({
  name: 'pi-rat/WebsocketNotificationsService',
  lifetime: 'singleton',
  factory: (ctx) => {
    const logger = useScopedLogger(ctx)
    const impl = new WebsocketNotificationsServiceImpl(logger)
    ctx.onDispose(() => impl.dispose())
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
    ctx.onDispose(() => impl[Symbol.dispose]())
    return impl
  },
})
