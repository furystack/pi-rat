import { getDataSetFor } from '@furystack/repository'
import { MovieDataSet } from '../../app-models/media/media-data-sets.js'
import type { OllamaTool } from './ollama-tools.js'

export const MoviesTool: OllamaTool = {
  toolDefinition: {
    type: 'function',
    function: {
      name: 'getMovies',
      description: 'Return a list of movies that are available in the system to watch in JSON format.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  shouldExecute: (response) => {
    return !!response.message.tool_calls?.some((toolCall) => toolCall.function?.name === 'getMovies')
  },
  execute: async (injector, _response) => {
    const moviesDataSet = getDataSetFor(injector, MovieDataSet)
    const movies = await moviesDataSet.find(injector, {
      filter: {},
      order: { createdAt: 'DESC' },
      top: 100,
    })
    return JSON.stringify(movies)
  },
}
