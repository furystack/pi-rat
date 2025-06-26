import type { Injector } from '@furystack/inject'
import { useRestService, Validate } from '@furystack/rest-service'
import type { AiApi } from 'common'
import schema from 'common/schemas/ai-api.json' with { type: 'json' }
import { getCorsOptions } from '../get-cors-options.js'
import { getPort } from '../get-port.js'
import { ChatAction } from './actions/chat-action.js'
import { GetModelsAction } from './actions/get-models-action.js'

export const setupAiRestApi = async (injector: Injector) => {
  await useRestService<AiApi>({
    injector,
    port: getPort(),
    root: 'api/ai',
    cors: getCorsOptions(),
    api: {
      GET: {
        '/models': Validate({
          schema,
          schemaName: 'GetModelsAction',
        })(GetModelsAction),
      },
      POST: {
        '/chat': Validate({
          schema,
          schemaName: 'ChatAction',
        })(ChatAction),
      },
    },
  })
}
