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
import { AiChat, AiChatMessage, type AiApi } from 'common'
import schema from 'common/schemas/ai-api.json' with { type: 'json' }
import { getCorsOptions } from '../get-cors-options.js'
import { getPort } from '../get-port.js'
import { ChatAction } from './actions/chat-action.js'
import { GetModelsAction } from './actions/get-models-action.js'

export const setupAiRestApi = async (injector: Injector) => {
  await useRestService<AiApi>({
    injector,
    root: 'api/ai',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/models': Validate({
          schema,
          schemaName: 'GetModelsAction',
        })(GetModelsAction),
        '/ai-chats': Validate({
          schema,
          schemaName: 'GetCollectionEndpoint<AiChat>',
        })(
          createGetCollectionEndpoint({
            model: AiChat,
            primaryKey: 'id',
          }),
        ),
        '/ai-chats/:id': Validate({
          schema,
          schemaName: 'GetEntityEndpoint<AiChat,"id">',
        })(
          createGetEntityEndpoint({
            model: AiChat,
            primaryKey: 'id',
          }),
        ),
        '/ai-chat-messages': Validate({
          schema,
          schemaName: 'GetCollectionEndpoint<AiChatMessage>',
        })(
          createGetCollectionEndpoint({
            model: AiChatMessage,
            primaryKey: 'id',
          }),
        ),
        '/ai-chat-messages/:id': Validate({
          schema,
          schemaName: 'GetEntityEndpoint<AiChatMessage,"id">',
        })(
          createGetEntityEndpoint({
            model: AiChatMessage,
            primaryKey: 'id',
          }),
        ),
      },
      POST: {
        '/chat': Validate({
          schema,
          schemaName: 'ChatAction',
        })(ChatAction),
        '/ai-chats': Validate({
          schema,
          schemaName: 'PostEndpoint<AiChat,"id">',
        })(
          createPostEndpoint({
            model: AiChat,
            primaryKey: 'id',
          }),
        ),
        '/ai-chat-messages': Validate({
          schema,
          schemaName: 'PostEndpoint<AiChatMessage,"id">',
        })(
          createPostEndpoint({
            model: AiChatMessage,
            primaryKey: 'id',
          }),
        ),
      },
      PATCH: {
        '/ai-chats/:id': Validate({
          schema,
          schemaName: 'PatchEndpoint<AiChat,"id">',
        })(
          createPatchEndpoint({
            model: AiChat,
            primaryKey: 'id',
          }),
        ),
      },
      DELETE: {
        '/ai-chats/:id': Validate({
          schema,
          schemaName: 'DeleteEndpoint<AiChat,"id">',
        })(
          createDeleteEndpoint({
            model: AiChat,
            primaryKey: 'id',
          }),
        ),
      },
    },
  })
}
