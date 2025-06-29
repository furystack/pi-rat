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
import { Chat, ChatInvitation, ChatMessage, type ChatApi } from 'common'
import chatApiSchema from 'common/schemas/chat-api.json' with { type: 'json' }
import { getCorsOptions } from '../get-cors-options.js'
import { getPort } from '../get-port.js'
import { AcceptInvitationAction } from './actions/accept-invitation-action.js'
import { RejectInvitationAction } from './actions/reject-invitation.js'
import { RevokeInvitationAction } from './actions/revoke-intivation.js'

export const setupChatRestApi = async (injector: Injector) => {
  await useRestService<ChatApi>({
    injector,
    root: 'api/chat',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/chat': Validate({
          schema: chatApiSchema,
          schemaName: 'GetCollectionEndpoint<Chat>',
        })(
          createGetCollectionEndpoint({
            model: Chat,
            primaryKey: 'id',
          }),
        ),
        '/chat/:id': Validate({
          schema: chatApiSchema,
          schemaName: 'GetEntityEndpoint<Chat,"id">',
        })(
          createGetEntityEndpoint({
            model: Chat,
            primaryKey: 'id',
          }),
        ),
        '/chat-messages': Validate({
          schema: chatApiSchema,
          schemaName: 'GetCollectionEndpoint<ChatMessage>',
        })(
          createGetCollectionEndpoint({
            model: ChatMessage,
            primaryKey: 'id',
          }),
        ),
        '/chat-messages/:id': Validate({
          schema: chatApiSchema,
          schemaName: 'GetEntityEndpoint<ChatMessage,"id">',
        })(
          createGetEntityEndpoint({
            model: ChatMessage,
            primaryKey: 'id',
          }),
        ),

        '/chat-invitations': Validate({
          schema: chatApiSchema,
          schemaName: 'GetCollectionEndpoint<ChatInvitation>',
        })(
          createGetCollectionEndpoint({
            model: ChatInvitation,
            primaryKey: 'id',
          }),
        ),
        '/chat-invitations/:id': Validate({
          schema: chatApiSchema,
          schemaName: 'GetEntityEndpoint<ChatInvitation,"id">',
        })(
          createGetEntityEndpoint({
            model: ChatInvitation,
            primaryKey: 'id',
          }),
        ),
      },
      POST: {
        '/chat': Validate({
          schema: chatApiSchema,
          schemaName: 'PostEndpoint<Chat,"id">',
        })(
          createPostEndpoint({
            model: Chat,
            primaryKey: 'id',
          }),
        ),
        '/chat-messages': Validate({
          schema: chatApiSchema,
          schemaName: 'PostEndpoint<ChatMessage,"id">',
        })(
          createPostEndpoint({
            model: ChatMessage,
            primaryKey: 'id',
          }),
        ),
        '/chat-invitations': Validate({
          schema: chatApiSchema,
          schemaName: 'PostEndpoint<ChatInvitation,"id">',
        })(
          createPostEndpoint({
            model: ChatInvitation,
            primaryKey: 'id',
          }),
        ),
        '/chat-invitations/:id/accept': Validate({
          schema: chatApiSchema,
          schemaName: 'AcceptInvitationAction',
        })(AcceptInvitationAction),
        '/chat-invitations/:id/reject': Validate({
          schema: chatApiSchema,
          schemaName: 'RejectInvitationAction',
        })(RejectInvitationAction),
        '/chat-invitations/:id/revoke': Validate({
          schema: chatApiSchema,
          schemaName: 'RevokeInvitationAction',
        })(RevokeInvitationAction),
      },
      PATCH: {
        '/chat/:id': Validate({
          schema: chatApiSchema,
          schemaName: 'PatchEndpoint<Chat,"id">',
        })(
          createPatchEndpoint({
            model: Chat,
            primaryKey: 'id',
          }),
        ),
        '/chat-messages/:id': Validate({
          schema: chatApiSchema,
          schemaName: 'PatchEndpoint<ChatMessage,"id">',
        })(
          createPatchEndpoint({
            model: ChatMessage,
            primaryKey: 'id',
          }),
        ),
        '/chat-invitations/:id': Validate({
          schema: chatApiSchema,
          schemaName: 'PatchEndpoint<ChatInvitation,"id">',
        })(
          createPatchEndpoint({
            model: ChatInvitation,
            primaryKey: 'id',
          }),
        ),
      },
      DELETE: {
        '/chat/:id': Validate({
          schema: chatApiSchema,
          schemaName: 'DeleteEndpoint<Chat,"id">',
        })(
          createDeleteEndpoint({
            model: Chat,
            primaryKey: 'id',
          }),
        ),
        '/chat-messages/:id': Validate({
          schema: chatApiSchema,
          schemaName: 'DeleteEndpoint<ChatMessage,"id">',
        })(
          createDeleteEndpoint({
            model: ChatMessage,
            primaryKey: 'id',
          }),
        ),
      },
    },
  })
}
