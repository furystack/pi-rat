import { Shade, createComponent } from '@furystack/shades'
import { CommandPalette } from '@furystack/shades-common-components'
import { appSettingsCommandProvider } from './command-providers/app-settings.js'
import { browserCommandProvider } from './command-providers/browser.js'
import { continueWatchingCommandProvider } from './command-providers/continue-watching.js'
import { entitiesCommandProvider } from './command-providers/entities.js'
import { searchMovieCommandProvider } from './command-providers/search-movie.js'
import { searchSeriesCommandProvider } from './command-providers/search-series.js'

export const PiRatCommandPalette = Shade({
  customElementName: 'pirat-command-palette',
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
