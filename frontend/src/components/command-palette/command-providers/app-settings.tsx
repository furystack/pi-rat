import { getCurrentUser } from '@furystack/core'
import { createComponent } from '@furystack/shades'
import type { CommandProvider } from '@furystack/shades-common-components'
import { Icon, icons } from '@furystack/shades-common-components'
import { navigateToRoute } from '../../../navigate-to-route.js'
import type { SuggestionOptions } from './create-suggestion.js'
import { createSuggestion, distinctByName } from './create-suggestion.js'

const AppSettingsSuggestions: SuggestionOptions[] = [
  {
    name: 'Application Settings',
    description: 'Configure application-wide settings',
    icon: <Icon icon={icons.wrench} size="small" />,
    score: 1,
    onSelected: ({ injector }) => {
      navigateToRoute(injector, '/app-settings')
    },
  },
]

export const appSettingsCommandProvider: CommandProvider = async ({ term, injector }) => {
  if (!term) {
    return []
  }

  if (!(await getCurrentUser(injector))?.roles?.includes('admin')) {
    return []
  }

  const fullHits = AppSettingsSuggestions.filter((c) => c.name.toLowerCase() === term.toLowerCase()).map((c) =>
    createSuggestion({ ...c, score: 1 }),
  )
  const startsWith = AppSettingsSuggestions.filter((c) => c.name.toLowerCase().startsWith(term.toLowerCase())).map(
    (c) => createSuggestion({ ...c, score: 2 }),
  )

  const contains = AppSettingsSuggestions.filter((c) => c.name.toLowerCase().includes(term.toLowerCase())).map((c) =>
    createSuggestion({ ...c, score: 3 }),
  )

  const descriptionContains = AppSettingsSuggestions.filter((c) =>
    c.description.toLowerCase().includes(term.toLowerCase()),
  ).map((c) => createSuggestion({ ...c, score: 2 }))

  return distinctByName(...fullHits, ...startsWith, ...contains, ...descriptionContains)
}
