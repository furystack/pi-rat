import type { OllamaTool } from './ollama-tools.js'

export const TimeTool: OllamaTool = {
  toolDefinition: {
    type: 'function',
    function: {
      name: 'getCurrentTime',
      description: 'Get the current time in ISO format',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  shouldExecute: (response) => {
    return !!response.message.tool_calls?.some((toolCall) => toolCall.function?.name === 'getCurrentTime')
  },
  execute: async (_injector, _response) => {
    const currentTime = new Date().toString()
    return currentTime
  },
}
