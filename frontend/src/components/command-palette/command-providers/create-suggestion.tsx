import type { Injector } from '@furystack/inject'
import { createComponent, Shade } from '@furystack/shades'
import { cssVariableTheme } from '@furystack/shades-common-components'
import type { CommandPaletteSuggestionResult } from '@furystack/shades-common-components'

export interface SuggestionOptions {
  name: string
  description: string
  icon: JSX.Element | string
  score: number
  onSelected: (options: { injector: Injector }) => void
}

type SuggestionItemProps = {
  name: string
  description: string
  icon: JSX.Element | string
}

const SuggestionItem = Shade<SuggestionItemProps>({
  customElementName: 'command-palette-suggestion-item',
  css: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    '& .suggestion-icon': {
      flexGrow: '0',
      margin: '0 15px 0 0',
      fontSize: '1.5em',
      width: '1.5em',
    },
    '& .suggestion-icon-inner': {
      width: '100%',
      height: '100%',
    },
    '& .suggestion-name': {
      color: cssVariableTheme.text.primary,
      fontWeight: 'bolder',
    },
    '& .suggestion-description': {
      color: cssVariableTheme.text.secondary,
    },
  },
  render: ({ props }) => {
    return (
      <>
        <div className="suggestion-icon">
          <div className="suggestion-icon-inner">{props.icon}</div>
        </div>
        <div>
          <div className="suggestion-name">{props.name}</div>
          <div className="suggestion-description">{props.description}</div>
        </div>
      </>
    )
  },
})

export const createSuggestion = (options: SuggestionOptions) => ({
  name: options.name,
  element: <SuggestionItem name={options.name} description={options.description} icon={options.icon} />,
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
