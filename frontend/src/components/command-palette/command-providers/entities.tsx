import type { CommandProvider } from '@furystack/shades-common-components'
import type { SuggestionOptions } from './create-suggestion.js'
import { createSuggestion, distinctByName } from './create-suggestion.js'
import { getCurrentUser } from '@furystack/core'
import { LocationService } from '@furystack/shades'

const EntitySuggestions: SuggestionOptions[] = [
  {
    name: 'Config entities',
    description: 'List, edit and create config entities',
    icon: '⚙️',
    score: 1,
    onSelected: ({ injector }) => {
      history.pushState({}, '', '/entities/config')
      injector.getInstance(LocationService).updateState()
    },
  },
  {
    name: 'Dashboard entities',
    description: 'List, edit and create dashboard entities',
    icon: '📔',
    score: 1,
    onSelected: ({ injector }) => {
      history.pushState({}, '', '/entities/dashboards')
      injector.getInstance(LocationService).updateState()
    },
  },
  {
    name: 'Drive entities',
    description: 'List, edit and create drive entities',
    icon: '💽',
    score: 1,
    onSelected: ({ injector }) => {
      history.pushState({}, '', '/entities/drives')
      injector.getInstance(LocationService).updateState()
    },
  },
  {
    name: 'User entities',
    description: 'List, edit and create user entities',
    icon: '👤',
    score: 1,
    onSelected: ({ injector }) => {
      history.pushState({}, '', '/entities/users')
      injector.getInstance(LocationService).updateState()
    },
  },
  {
    name: 'Movie entities',
    description: 'List, edit and create movie entities',
    icon: '🎥',
    score: 1,
    onSelected: ({ injector }) => {
      history.pushState({}, '', '/entities/movies')
      injector.getInstance(LocationService).updateState()
    },
  },
  {
    name: 'Movie File entities',
    description: 'List, edit and create movie file entities',
    icon: '🎞️',
    score: 1,
    onSelected: ({ injector }) => {
      history.pushState({}, '', '/entities/movie-files')
      injector.getInstance(LocationService).updateState()
    },
  },
  {
    name: 'OMDB Movie Metadata entities',
    description: 'List, edit and create OMDB Movie Metadata entities',
    icon: '🌐',
    score: 1,
    onSelected: ({ injector }) => {
      history.pushState({}, '', '/entities/omdb-movie-metadata')
      injector.getInstance(LocationService).updateState()
    },
  },
  {
    name: 'OMDB Series metadata entities',
    description: 'List, edit and create OMDB Series metadata entities',
    icon: '🌐',
    score: 1,
    onSelected: ({ injector }) => {
      history.pushState({}, '', '/entities/omdb-series-metadata')
      injector.getInstance(LocationService).updateState()
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
