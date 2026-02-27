import { Injectable, Injected } from '@furystack/inject'
import type { AiChatMessage } from 'common'
import { AiApiClient } from '../../services/api-clients/ai-api-client.js'

@Injectable({ lifetime: 'singleton' })
export class AiChatMessageService {
  @Injected(AiApiClient)
  declare private aiApi: AiApiClient

  public async createChatMessage(chat: AiChatMessage) {
    const result = await this.aiApi.call({
      method: 'POST',
      action: '/ai-chat-messages',
      body: chat,
    })
    return result
  }
}
