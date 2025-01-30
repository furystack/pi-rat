import { Injectable, Injected } from '@furystack/inject'
import { getLogger, type ScopedLogger } from '@furystack/logging'
import { EventHub } from '@furystack/utils'
import type { WebsocketMessage } from 'common'
import { environmentOptions } from '../environment-options.js'

@Injectable({ lifetime: 'singleton' })
export class WebsocketNotificationsService extends EventHub<{ onMessage: WebsocketMessage; onInvalidMessage: [any] }> {
  private readonly wsUrl = new URL(`${environmentOptions.serviceUrl}/ws`, window.location.href)

  public socket = new WebSocket(this.wsUrl.toString().replace('http', 'ws'))

  public dispose() {
    this.socket.close()
  }

  @Injected((i) => getLogger(i).withScope('WebsocketNotificationsService'))
  declare private logger: ScopedLogger

  constructor() {
    super()
    this.socket.onmessage = async ({ data }) => {
      if (typeof data === 'string') {
        this.emit('onMessage', JSON.parse(data) as WebsocketMessage)
      } else {
        await this.logger.warning({ message: 'Invalid message received', data })
      }
    }
  }
}
