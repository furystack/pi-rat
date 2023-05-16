import type { CommandProvider } from '@furystack/shades-common-components'
import { InstallService } from '../../../services/install-service.js'
import { LocationService } from '@furystack/shades'
import { createSuggestion } from './create-suggestion.js'

export const fetchFromOmdbCommandProvider: CommandProvider = async ({ injector, term }) => {
  if (!(term.toLocaleLowerCase() === 'omdb')) {
    return []
  }
  const serviceStatus = await injector.getInstance(InstallService).getServiceStatus()
  if (serviceStatus.state !== 'installed' || !serviceStatus.services.omdb) {
    return []
  }

  return [
    createSuggestion({
      icon: '🎬',
      name: 'Search for OMDB movies',
      description: 'Search for movies in OMDB',
      score: 100,
      onSelected: ({ injector: i }) => {
        /** */
        history.pushState({}, '', '/omdb')
        i.getInstance(LocationService).updateState()
      },
    }),
  ]
}
