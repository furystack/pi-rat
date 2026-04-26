import type { Injector } from '@furystack/inject'
import {
  createDeleteEndpoint,
  createGetCollectionEndpoint,
  createGetEntityEndpoint,
  createPatchEndpoint,
  createPostEndpoint,
  useRestService,
  Validate,
} from '@furystack/rest-service'
import type { ChatApi } from 'common'
import chatApiSchema from 'common/schemas/chat-api.json' with { type: 'json' }
import { getCorsOptions } from '../../get-cors-options.js'
import { getPort } from '../../get-port.js'
import { AcceptInvitationAction } from './actions/accept-invitation-action.js'
import { RejectInvitationAction } from './actions/reject-invitation.js'
import { RevokeInvitationAction } from './actions/revoke-intivation.js'
import { ChatDataSet, ChatInvitationDataSet, ChatMessageDataSet } from './setup-chat-store.js'

export const setupChatRestApi = async (injector: Injector) => {
  await useRestService<ChatApi>({
    injector,
    root: 'api/chat',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/chat': Validate({ schema: chatApiSchema, schemaName: 'GetCollectionEndpoint<Chat>' })(
          createGetCollectionEndpoint(ChatDataSet),
        ),
        '/chat/:id': Validate({ schema: chatApiSchema, schemaName: 'GetEntityEndpoint<Chat,"id">' })(
          createGetEntityEndpoint(ChatDataSet),
        ),
        '/chat-messages': Validate({ schema: chatApiSchema, schemaName: 'GetCollectionEndpoint<ChatMessage>' })(
          createGetCollectionEndpoint(ChatMessageDataSet),
        ),
        '/chat-messages/:id': Validate({ schema: chatApiSchema, schemaName: 'GetEntityEndpoint<ChatMessage,"id">' })(
          createGetEntityEndpoint(ChatMessageDataSet),
        ),
        '/chat-invitations': Validate({ schema: chatApiSchema, schemaName: 'GetCollectionEndpoint<ChatInvitation>' })(
          createGetCollectionEndpoint(ChatInvitationDataSet),
        ),
        '/chat-invitations/:id': Validate({
          schema: chatApiSchema,
          schemaName: 'GetEntityEndpoint<ChatInvitation,"id">',
        })(createGetEntityEndpoint(ChatInvitationDataSet)),
      },
      POST: {
        '/chat': Validate({ schema: chatApiSchema, schemaName: 'PostEndpoint<Chat,"id">' })(
          createPostEndpoint(ChatDataSet),
        ),
        '/chat-messages': Validate({ schema: chatApiSchema, schemaName: 'PostEndpoint<ChatMessage,"id">' })(
          createPostEndpoint(ChatMessageDataSet),
        ),
        '/chat-invitations': Validate({ schema: chatApiSchema, schemaName: 'PostEndpoint<ChatInvitation,"id">' })(
          createPostEndpoint(ChatInvitationDataSet),
        ),
        '/chat-invitations/:id/accept': Validate({ schema: chatApiSchema, schemaName: 'AcceptInvitationAction' })(
          AcceptInvitationAction,
        ),
        '/chat-invitations/:id/reject': Validate({ schema: chatApiSchema, schemaName: 'RejectInvitationAction' })(
          RejectInvitationAction,
        ),
        '/chat-invitations/:id/revoke': Validate({ schema: chatApiSchema, schemaName: 'RevokeInvitationAction' })(
          RevokeInvitationAction,
        ),
      },
      PATCH: {
        '/chat/:id': Validate({ schema: chatApiSchema, schemaName: 'PatchEndpoint<Chat,"id">' })(
          createPatchEndpoint(ChatDataSet),
        ),
        '/chat-messages/:id': Validate({ schema: chatApiSchema, schemaName: 'PatchEndpoint<ChatMessage,"id">' })(
          createPatchEndpoint(ChatMessageDataSet),
        ),
        '/chat-invitations/:id': Validate({ schema: chatApiSchema, schemaName: 'PatchEndpoint<ChatInvitation,"id">' })(
          createPatchEndpoint(ChatInvitationDataSet),
        ),
      },
      DELETE: {
        '/chat/:id': Validate({ schema: chatApiSchema, schemaName: 'DeleteEndpoint<Chat,"id">' })(
          createDeleteEndpoint(ChatDataSet),
        ),
        '/chat-messages/:id': Validate({ schema: chatApiSchema, schemaName: 'DeleteEndpoint<ChatMessage,"id">' })(
          createDeleteEndpoint(ChatMessageDataSet),
        ),
      },
    },
  })
}
