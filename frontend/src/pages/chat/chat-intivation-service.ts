import { Cache } from '@furystack/cache'
import type { FilterType } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import { EventHub } from '@furystack/utils'
import type { ChatInvitation } from 'common'
import { ChatApiClient } from '../../services/api-clients/chat-api-client.js'

@Injectable({ lifetime: 'singleton' })
export class ChatInvitationService extends EventHub<{
  invitationAccepted: ChatInvitation
  invitationCreated: ChatInvitation
  invitationRejected: ChatInvitation
  invitationRevoked: ChatInvitation
}> {
  @Injected(ChatApiClient)
  declare private readonly chatApiClient: ChatApiClient

  private chatInvitationCache = new Cache({
    capacity: 100,
    load: async (id: string) => {
      const { result } = await this.chatApiClient.call({
        method: 'GET',
        action: '/chat-invitations/:id',
        url: { id },
        query: {},
      })
      return result
    },
  })

  private chatInvitationQueryCache = new Cache({
    capacity: 100,
    load: async (findOptions: { filter?: FilterType<ChatInvitation> }) => {
      const { result } = await this.chatApiClient.call({
        method: 'GET',
        action: '/chat-invitations',
        query: {
          findOptions,
        },
      })

      result.entries.forEach((entry) => {
        this.chatInvitationCache.setExplicitValue({
          loadArgs: [entry.id],
          value: {
            status: 'loaded',
            value: entry,
            updatedAt: new Date(),
          },
        })
      })

      return result
    },
  })

  public async getChatInvitation(id: string) {
    return this.chatInvitationCache.get(id)
  }

  public getChatInvitationAsObservable(id: string) {
    return this.chatInvitationCache.getObservable(id)
  }

  public async getChatInvitations(findOptions: { filter?: FilterType<ChatInvitation> }) {
    return this.chatInvitationQueryCache.get(findOptions)
  }

  public getChatInvitationsAsObservable(findOptions: { filter?: FilterType<ChatInvitation> }) {
    return this.chatInvitationQueryCache.getObservable(findOptions)
  }

  public async addChatInvitation(chat: ChatInvitation) {
    const { result } = await this.chatApiClient.call({
      method: 'POST',
      action: '/chat-invitations',
      body: chat,
    })

    this.chatInvitationCache.setExplicitValue({
      loadArgs: [result.id],
      value: {
        status: 'loaded',
        value: result,
        updatedAt: new Date(),
      },
    })

    this.chatInvitationQueryCache.obsoleteRange(() => true)
    this.emit('invitationCreated', result)
    return result
  }

  public async acceptChatInvitation(id: string) {
    const { result } = await this.chatApiClient.call({
      method: 'POST',
      action: '/chat-invitations/:id/accept',
      url: { id },
    })

    this.chatInvitationCache.setExplicitValue({
      loadArgs: [id],
      value: {
        status: 'loaded',
        value: result,
        updatedAt: new Date(),
      },
    })
    this.chatInvitationQueryCache.obsoleteRange(() => true)
    this.emit('invitationAccepted', result)
    return result
  }

  public async rejectChatInvitation(id: string) {
    const { result } = await this.chatApiClient.call({
      method: 'POST',
      action: '/chat-invitations/:id/reject',
      url: { id },
    })

    this.chatInvitationCache.setExplicitValue({
      loadArgs: [id],
      value: {
        status: 'loaded',
        value: result,
        updatedAt: new Date(),
      },
    })
    this.chatInvitationQueryCache.obsoleteRange(() => true)
    this.emit('invitationRejected', result)
    return result
  }

  public async revokeChatInvitation(id: string) {
    const { result } = await this.chatApiClient.call({
      method: 'POST',
      action: '/chat-invitations/:id/revoke',
      url: { id },
    })

    this.chatInvitationCache.setExplicitValue({
      loadArgs: [id],
      value: {
        status: 'loaded',
        value: result,
        updatedAt: new Date(),
      },
    })
    this.chatInvitationQueryCache.obsoleteRange(() => true)
    this.emit('invitationRevoked', result)
    return result
  }
}
