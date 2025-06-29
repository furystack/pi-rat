import { getRepository } from '@furystack/repository'
import { User } from 'common'
import type { OllamaTool } from './ollama-tools.js'

export const UserContextTool: OllamaTool = {
  toolDefinition: {
    type: 'function',
    function: {
      name: 'getUserInformation',
      description: 'Get information about a specific user in JSON format',
      parameters: {
        type: 'object',
        properties: {
          userName: {
            type: 'string',
            description: 'The unique username of the user to get context for. This is an e-mail address in this system',
          },
        },
        required: ['userName'],
      },
    },
  },
  shouldExecute: (response) => {
    return !!response.message.tool_calls?.some((toolCall) => toolCall.function?.name === 'getUserInformation')
  },
  execute: async (injector, response) => {
    const userName = response.message.tool_calls?.[0].function?.arguments?.userName

    if (!userName || typeof userName !== 'string' || userName.trim() === '') {
      return null
    }

    const usersStore = getRepository(injector).getDataSetFor(User, 'username')

    const user = await usersStore.get(injector, userName)

    if (!user) {
      return null
    }

    return JSON.stringify(user)
  },
}
