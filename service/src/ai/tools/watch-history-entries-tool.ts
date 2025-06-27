import { getRepository } from '@furystack/repository'
import { WatchHistoryEntry } from 'common'
import type { OllamaTool } from './ollama-tools.js'

export const WatchHistoryEntriesTool: OllamaTool = {
  toolDefinition: {
    type: 'function',
    function: {
      name: 'getMovieWatchHistory',
      description:
        'Return a list of movie watch entries in JSON format. This method is useful when a user asks about in-progress movies or movies they have watched recently.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  shouldExecute: (response) => {
    return !!response.message.tool_calls?.some((toolCall) => toolCall.function?.name === 'getMovieWatchHistory')
  },
  execute: async (injector, _response) => {
    const watchHistoryDataSet = getRepository(injector).getDataSetFor(WatchHistoryEntry, 'id')
    const movies = await watchHistoryDataSet.find(injector, {
      filter: {},
      order: { updatedAt: 'DESC' },
      top: 100,
    })
    return JSON.stringify(movies)
  },
}
