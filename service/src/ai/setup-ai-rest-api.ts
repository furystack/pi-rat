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
import { type AiApi } from 'common'
import schema from 'common/schemas/ai-api.json' with { type: 'json' }
import { getCorsOptions } from '../get-cors-options.js'
import { getPort } from '../get-port.js'
import { ChatAction } from './actions/chat-action.js'
import { GetModelsAction } from './actions/get-models-action.js'
import { AiChatDataSet, AiChatMessageDataSet } from './setup-ai-store.js'

export const setupAiRestApi = async (injector: Injector) => {
  await useRestService<AiApi>({
    injector,
    root: 'api/ai',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/models': Validate({ schema, schemaName: 'GetModelsAction' })(GetModelsAction),
        '/ai-chats': Validate({ schema, schemaName: 'GetCollectionEndpoint<AiChat>' })(
          createGetCollectionEndpoint(AiChatDataSet),
        ),
        '/ai-chats/:id': Validate({ schema, schemaName: 'GetEntityEndpoint<AiChat,"id">' })(
          createGetEntityEndpoint(AiChatDataSet),
        ),
        '/ai-chat-messages': Validate({ schema, schemaName: 'GetCollectionEndpoint<AiChatMessage>' })(
          createGetCollectionEndpoint(AiChatMessageDataSet),
        ),
        '/ai-chat-messages/:id': Validate({ schema, schemaName: 'GetEntityEndpoint<AiChatMessage,"id">' })(
          createGetEntityEndpoint(AiChatMessageDataSet),
        ),
      },
      POST: {
        '/chat': Validate({ schema, schemaName: 'ChatAction' })(ChatAction),
        '/ai-chats': Validate({ schema, schemaName: 'PostEndpoint<AiChat,"id">' })(createPostEndpoint(AiChatDataSet)),
        '/ai-chat-messages': Validate({ schema, schemaName: 'PostEndpoint<AiChatMessage,"id">' })(
          createPostEndpoint(AiChatMessageDataSet),
        ),
      },
      PATCH: {
        '/ai-chats/:id': Validate({ schema, schemaName: 'PatchEndpoint<AiChat,"id">' })(
          createPatchEndpoint(AiChatDataSet),
        ),
      },
      DELETE: {
        '/ai-chats/:id': Validate({ schema, schemaName: 'DeleteEndpoint<AiChat,"id">' })(
          createDeleteEndpoint(AiChatDataSet),
        ),
      },
    },
  })
}
