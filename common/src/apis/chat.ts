import type {
  DeleteEndpoint,
  GetCollectionEndpoint,
  GetEntityEndpoint,
  PatchEndpoint,
  PostEndpoint,
  RestApi,
} from '@furystack/rest'
import type { Chat, ChatInvitation, ChatMessage } from '../models/index.js'

export type AcceptInvitationAction = {
  result: ChatInvitation
  url: {
    id: string
  }
}

export type RejectInvitationAction = {
  result: ChatInvitation
  url: {
    id: string
  }
}

export type RevokeInvitationAction = {
  result: ChatInvitation
  url: {
    id: string
  }
}

export interface ChatApi extends RestApi {
  GET: {
    '/chat': GetCollectionEndpoint<Chat>
    '/chat/:id': GetEntityEndpoint<Chat, 'id'>
    '/chat-messages': GetCollectionEndpoint<ChatMessage>
    '/chat-messages/:id': GetEntityEndpoint<ChatMessage, 'id'>
    '/chat-invitations': GetCollectionEndpoint<ChatInvitation>
    '/chat-invitations/:id': GetEntityEndpoint<ChatInvitation, 'id'>
  }
  POST: {
    '/chat': PostEndpoint<Chat, 'id'>
    '/chat-messages': PostEndpoint<ChatMessage, 'id'>
    '/chat-invitations': PostEndpoint<ChatInvitation, 'id'>
    '/chat-invitations/:id/accept': AcceptInvitationAction
    '/chat-invitations/:id/reject': RejectInvitationAction
    '/chat-invitations/:id/revoke': RevokeInvitationAction
  }
  PATCH: {
    '/chat/:id': PatchEndpoint<Chat, 'id'>
    '/chat-messages/:id': PatchEndpoint<ChatMessage, 'id'>
    '/chat-invitations/:id': PatchEndpoint<ChatInvitation, 'id'>
  }
  DELETE: {
    '/chat/:id': DeleteEndpoint<Chat, 'id'>
    '/chat-messages/:id': DeleteEndpoint<ChatMessage, 'id'>
  }
}
