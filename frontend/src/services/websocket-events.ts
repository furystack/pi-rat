import { EventHub } from '@furystack/utils'
import { environmentOptions } from '../environment-options.js'
import { Injectable } from '@furystack/inject'

@Injectable({ lifetime: 'singleton' })
export class WebsocketNotificationsService extends EventHub<'onMessage', { onMessage: unknown }> {
  private readonly wsUrl = new URL(`${environmentOptions.serviceUrl}/ws`, window.location.href)

  public socket = new WebSocket(this.wsUrl.toString().replace('http', 'ws'))

  public dispose() {
    this.socket.close()
  }

  constructor() {
    super()
    this.socket.onmessage = (event) => {
      this.emit('onMessage', JSON.parse(event.data))
    }
  }
}
