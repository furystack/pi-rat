import type { CommandProvider } from '@furystack/shades-common-components'
import type { SuggestionOptions } from './create-suggestion.js'
import { createSuggestion, distinctByName } from './create-suggestion.js'

export const BrowserCommands: SuggestionOptions[] = [
  {
    name: 'Refresh window',
    description: 'Restarts the whole app by reloading the current window.',
    score: 1,
    icon: '🔃',
    onSelected: () => window.location.reload(),
  },
]

export const browserCommandProvider: CommandProvider = async ({ term }) => {
  if (!term) {
    return []
  }

  const fullHits = BrowserCommands.filter((c) => c.name.toLowerCase() === term.toLowerCase()).map((c) =>
    createSuggestion({ ...c, score: 1 }),
  )
  const startsWith = BrowserCommands.filter((c) => c.name.toLowerCase().startsWith(term.toLowerCase())).map((c) =>
    createSuggestion({ ...c, score: 2 }),
  )

  const contains = BrowserCommands.filter((c) => c.name.toLowerCase().includes(term.toLowerCase())).map((c) =>
    createSuggestion({ ...c, score: 3 }),
  )

  const descriptionContains = BrowserCommands.filter((c) =>
    c.description.toLowerCase().includes(term.toLowerCase()),
  ).map((c) => createSuggestion({ ...c, score: 2 }))

  return distinctByName(...fullHits, ...startsWith, ...contains, ...descriptionContains)
}
