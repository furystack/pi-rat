import type { Injector } from '@furystack/inject'
import { createComponent } from '@furystack/shades'
import type { CommandPaletteSuggestionResult } from '@furystack/shades-common-components'

export interface SuggestionOptions {
  name: string
  description: string
  icon: JSX.Element | string
  score: number
  onSelected: (options: { injector: Injector }) => void
}

export const createSuggestion = (options: SuggestionOptions) => ({
  name: options.name,
  element: (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
      <div style={{ flexGrow: '0', margin: '0 15px 0 0', fontSize: '1.5em', width: '1.5em' }}>
        <div style={{ width: '100%', height: '100%' }}>{options.icon}</div>
      </div>
      <div>
        <div style={{ color: '#bbb', fontWeight: 'bolder' }}>{options.name}</div>
        <div style={{ color: '#777' }}>{options.description}</div>
      </div>
    </div>
  ),
  score: options.score,
  onSelected: options.onSelected,
})

export const distinctByName = (
  ...entries: Array<ReturnType<typeof createSuggestion>>
): CommandPaletteSuggestionResult[] =>
  entries.reduce(
    (prev, current) => {
      if (!prev.some((i) => i.name === current.name)) {
        return [...prev, current]
      }
      return prev.map((entry) => {
        if (entry.name === current.name && entry.score < current.score) {
          return current
        }
        return entry
      })
    },
    [] as Array<ReturnType<typeof createSuggestion>>,
  )
