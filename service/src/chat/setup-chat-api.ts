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
import { Chat, ChatMessage, ChatMessageAttachment, type ChatApi } from 'common'
import chatApiSchema from 'common/schemas/chat-api.json' with { type: 'json' }
import { getCorsOptions } from '../get-cors-options.js'
import { getPort } from '../get-port.js'

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
        '/chat-message-attachments': Validate({
          schema: chatApiSchema,
          schemaName: 'GetCollectionEndpoint<ChatMessageAttachment>',
        })(
          createGetCollectionEndpoint({
            model: ChatMessageAttachment,
            primaryKey: 'id',
          }),
        ),
        '/chat-message-attachments/:id': Validate({
          schema: chatApiSchema,
          schemaName: 'GetEntityEndpoint<ChatMessageAttachment,"id">',
        })(
          createGetEntityEndpoint({
            model: ChatMessageAttachment,
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
        '/chat-message-attachments': Validate({
          schema: chatApiSchema,
          schemaName: 'PostEndpoint<ChatMessageAttachment,"id">',
        })(
          createPostEndpoint({
            model: ChatMessageAttachment,
            primaryKey: 'id',
          }),
        ),
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
        '/chat-message-attachments/:id': Validate({
          schema: chatApiSchema,
          schemaName: 'PatchEndpoint<ChatMessageAttachment,"id">',
        })(
          createPatchEndpoint({
            model: ChatMessageAttachment,
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
        '/chat-message-attachments/:id': Validate({
          schema: chatApiSchema,
          schemaName: 'DeleteEndpoint<ChatMessageAttachment,"id">',
        })(
          createDeleteEndpoint({
            model: ChatMessageAttachment,
            primaryKey: 'id',
          }),
        ),
      },
    },
  })
}
