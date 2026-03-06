import { createComponent, type TitleResolverOptions } from '@furystack/shades'
import { icons } from '@furystack/shades-common-components'
import type { MatchResult } from 'path-to-regexp'
import { PiRatLazyLoad } from '../components/pirat-lazy-load.js'

export const loggingRoute = {
  meta: { title: 'Logging', icon: icons.fileText },
  component: ({ outlet }: { outlet?: JSX.Element }) => (
    <PiRatLazyLoad
      component={async () => {
        const { RouteIndexPage } = await import('../components/route-index-page.js')
        return <RouteIndexPage outlet={outlet} />
      }}
    />
  ),
  children: {
    '/terminal': {
      meta: { title: 'Log Terminal', icon: icons.fileText },
      component: () => (
        <PiRatLazyLoad
          component={async () => {
            const { LogEntriesTerminal } = await import('../pages/logging/log-entries-terminal.js')
            return <LogEntriesTerminal />
          }}
        />
      ),
    },
    '/log-entry/:id': {
      meta: {
        title: ({ match }: TitleResolverOptions<{ id: string }>): string => `Log Entry ${match.params.id}`,
        icon: icons.fileText,
        hidden: true,
      },
      component: ({ match }: { match: MatchResult<{ id: string }> }) => (
        <PiRatLazyLoad
          component={async () => {
            const { LogEntry } = await import('../pages/logging/log-entry.js')
            return <LogEntry id={match.params.id} />
          }}
        />
      ),
    },
    '/': {
      component: () => <></>,
      routingOptions: { end: false },
    },
  },
}
