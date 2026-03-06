import { Shade, createComponent } from '@furystack/shades'
import { CommandPalette, cssVariableTheme } from '@furystack/shades-common-components'
import { appSettingsCommandProvider } from './command-providers/app-settings.js'
import { browserCommandProvider } from './command-providers/browser.js'
import { continueWatchingCommandProvider } from './command-providers/continue-watching.js'
import { entitiesCommandProvider } from './command-providers/entities.js'
import { searchMovieCommandProvider } from './command-providers/search-movie.js'
import { searchSeriesCommandProvider } from './command-providers/search-series.js'

export const PiRatCommandPalette = Shade({
  shadowDomName: 'pirat-command-palette',
  css: {
    display: 'block',
    marginLeft: 'auto',
    maxWidth: '220px',
    transition: `max-width ${cssVariableTheme.transitions.duration.slow} ${cssVariableTheme.transitions.easing.default}`,
    '&:focus-within': {
      maxWidth: '100%',
    },
  },
  render: () => {
    return (
      <CommandPalette
        commandProviders={[
          appSettingsCommandProvider,
          browserCommandProvider,
          continueWatchingCommandProvider,
          entitiesCommandProvider,
          searchMovieCommandProvider,
          searchSeriesCommandProvider,
        ]}
        defaultPrefix=">"
      />
    )
  },
})
