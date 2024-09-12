import { getCurrentUser } from '@furystack/core'
import type { CommandProvider } from '@furystack/shades-common-components'
import { navigateToRoute } from '../../../navigate-to-route.js'
import {
  entityConfigRoute,
  entityDashboardsRoute,
  entityDeviceRoute,
  entityDrivesRoute,
  entityMovieFilesRoute,
  entityMoviesRoute,
  entityOmdbMovieMetadataRoute,
  entityOmdbSeriesMetadataRoute,
  entityUsersRoute,
} from '../../routes/entity-routes.js'
import type { SuggestionOptions } from './create-suggestion.js'
import { createSuggestion, distinctByName } from './create-suggestion.js'

const EntitySuggestions: SuggestionOptions[] = [
  {
    name: 'Config entities',
    description: 'List, edit and create config entities',
    icon: '⚙️',
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, entityConfigRoute, {})
    },
  },
  {
    name: 'Dashboard entities',
    description: 'List, edit and create dashboard entities',
    icon: '📔',
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, entityDashboardsRoute, {})
    },
  },
  {
    name: 'Drive entities',
    description: 'List, edit and create drive entities',
    icon: '💽',
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, entityDrivesRoute, {})
    },
  },
  {
    name: 'User entities',
    description: 'List, edit and create user entities',
    icon: '👤',
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, entityUsersRoute, {})
    },
  },
  {
    name: 'Movie entities',
    description: 'List, edit and create movie entities',
    icon: '🎥',
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, entityMoviesRoute, {})
    },
  },
  {
    name: 'Movie File entities',
    description: 'List, edit and create movie file entities',
    icon: '🎞️',
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, entityMovieFilesRoute, {})
    },
  },
  {
    name: 'OMDB Movie Metadata entities',
    description: 'List, edit and create OMDB Movie Metadata entities',
    icon: '🌐',
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, entityOmdbMovieMetadataRoute, {})
    },
  },
  {
    name: 'OMDB Series metadata entities',
    description: 'List, edit and create OMDB Series metadata entities',
    icon: '🌐',
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, entityOmdbSeriesMetadataRoute, {})
    },
  },
  {
    name: 'IOT Device Entities',
    description: 'List, edit and create IOT Device entities',
    icon: '📡',
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, entityDeviceRoute, {})
    },
  },
]

export const entitiesCommandProvider: CommandProvider = async ({ term, injector }) => {
  if (!term) {
    return []
  }

  if (!(await getCurrentUser(injector))?.roles?.includes('admin')) {
    return []
  }

  const fullHits = EntitySuggestions.filter((c) => c.name.toLowerCase() === term.toLowerCase()).map((c) =>
    createSuggestion({ ...c, score: 1 }),
  )
  const startsWith = EntitySuggestions.filter((c) => c.name.toLowerCase().startsWith(term.toLowerCase())).map((c) =>
    createSuggestion({ ...c, score: 2 }),
  )

  const contains = EntitySuggestions.filter((c) => c.name.toLowerCase().includes(term.toLowerCase())).map((c) =>
    createSuggestion({ ...c, score: 3 }),
  )

  const descriptionContains = EntitySuggestions.filter((c) =>
    c.description.toLowerCase().includes(term.toLowerCase()),
  ).map((c) => createSuggestion({ ...c, score: 2 }))

  return distinctByName(...fullHits, ...startsWith, ...contains, ...descriptionContains)
}
