import { Injectable, Injected } from '@furystack/inject'
import { getLogger, type ScopedLogger } from '@furystack/logging'
import { EventHub } from '@furystack/utils'
import type { WebsocketMessage } from 'common'
import { environmentOptions } from '../environment-options.js'

@Injectable({ lifetime: 'singleton' })
export class WebsocketNotificationsService extends EventHub<{ onMessage: WebsocketMessage; onInvalidMessage: [any] }> {
  private readonly wsUrl = new URL(`${environmentOptions.serviceUrl}/ws`, window.location.href)

  public socket: WebSocket

  public dispose() {
    this.socket.close()
  }

  @Injected((i) => getLogger(i).withScope('WebsocketNotificationsService'))
  declare private logger: ScopedLogger

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
        // this.createSocket() // Recreate the socket on unexpected closure
      }
    }
    return socket
  }

  constructor() {
    super()
    this.socket = this.createSocket()
  }
}
