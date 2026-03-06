import { createComponent } from '@furystack/shades'
import type { CommandProvider } from '@furystack/shades-common-components'
import { Icon, icons } from '@furystack/shades-common-components'
import { navigateToRoute } from '../../../navigate-to-route.js'
import { SessionService } from '../../../services/session.js'
import type { SuggestionOptions } from './create-suggestion.js'
import { createSuggestion, distinctByName } from './create-suggestion.js'

const getEntitySuggestions = (): SuggestionOptions[] => [
  {
    name: 'Config entities',
    description: 'List, edit and create config entities',
    icon: <Icon icon={icons.settings} size="small" />,
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, '/entities/config')
    },
  },
  {
    name: 'Dashboard entities',
    description: 'List, edit and create dashboard entities',
    icon: <Icon icon={icons.layers} size="small" />,
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, '/entities/dashboards')
    },
  },
  {
    name: 'Drive entities',
    description: 'List, edit and create drive entities',
    icon: '💽',
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, '/entities/drives')
    },
  },
  {
    name: 'User entities',
    description: 'List, edit and create user entities',
    icon: <Icon icon={icons.user} size="small" />,
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, '/entities/users')
    },
  },
  {
    name: 'Movie entities',
    description: 'List, edit and create movie entities',
    icon: <Icon icon={icons.film} size="small" />,
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, '/entities/movies')
    },
  },
  {
    name: 'Movie File entities',
    description: 'List, edit and create movie file entities',
    icon: <Icon icon={icons.file} size="small" />,
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, '/entities/movie-files')
    },
  },
  {
    name: 'OMDB Movie Metadata entities',
    description: 'List, edit and create OMDB Movie Metadata entities',
    icon: <Icon icon={icons.globe} size="small" />,
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, '/entities/omdb-movie-metadata')
    },
  },
  {
    name: 'OMDB Series metadata entities',
    description: 'List, edit and create OMDB Series metadata entities',
    icon: <Icon icon={icons.globe} size="small" />,
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, '/entities/omdb-series-metadata')
    },
  },
  {
    name: 'IOT Device Entities',
    description: 'List, edit and create IOT Device entities',
    icon: '📡',
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, '/entities/iot-devices')
    },
  },
  {
    name: 'Log entries',
    description: 'View the log entries',
    icon: <Icon icon={icons.fileText} size="small" />,
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, '/entities/logging')
    },
  },
]

export const entitiesCommandProvider: CommandProvider = async ({ term, injector }) => {
  if (!term) {
    return []
  }

  const currentUser = injector.getInstance(SessionService).currentUser.getValue()
  if (!currentUser?.roles?.includes('admin')) {
    return []
  }

  const suggestions = getEntitySuggestions()

  const fullHits = suggestions
    .filter((c) => c.name.toLowerCase() === term.toLowerCase())
    .map((c) => createSuggestion({ ...c, score: 1 }))
  const startsWith = suggestions
    .filter((c) => c.name.toLowerCase().startsWith(term.toLowerCase()))
    .map((c) => createSuggestion({ ...c, score: 2 }))

  const contains = suggestions
    .filter((c) => c.name.toLowerCase().includes(term.toLowerCase()))
    .map((c) => createSuggestion({ ...c, score: 3 }))

  const descriptionContains = suggestions
    .filter((c) => c.description.toLowerCase().includes(term.toLowerCase()))
    .map((c) => createSuggestion({ ...c, score: 2 }))

  return distinctByName(...fullHits, ...startsWith, ...contains, ...descriptionContains)
}
