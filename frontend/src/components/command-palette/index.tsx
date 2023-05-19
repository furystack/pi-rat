import { Shade, createComponent } from '@furystack/shades'
import { CommandPalette } from '@furystack/shades-common-components'
import { browserCommandProvider } from './command-providers/browser.js'
import { entitiesCommandProvider } from './command-providers/entities.js'
import { continueWatchingCommandProvider } from './command-providers/continue-watching.js'
import { searchSeriesCommandProvider } from './command-providers/search-series.js'
import { searchMovieCommandProvider } from './command-providers/search-movie.js'

export const PiRatCommandPalette = Shade({
  shadowDomName: 'pirat-command-palette',
  render: () => {
    return (
      <CommandPalette
        commandProviders={[
          browserCommandProvider,
          entitiesCommandProvider,
          continueWatchingCommandProvider,
          searchSeriesCommandProvider,
          searchMovieCommandProvider,
        ]}
        defaultPrefix=">"
      />
    )
  },
})
