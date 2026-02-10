import { createComponent } from '@furystack/shades'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'

export const LogEntriesTerminalRoute = {
  url: '/logging/terminal',
  component: () => {
    return (
      <PiRatLazyLoad
        component={async () => {
          const { LogEntriesTerminal } = await import('../../pages/logging/log-entries-terminal.js')
          return <LogEntriesTerminal />
        }}
      />
    )
  },
}

export const logEntryRoute = {
  url: '/logging/log-entry/:id',
  component: ({ match }: { match: { params: { id: string } } }) => {
    return (
      <PiRatLazyLoad
        component={async () => {
          const { LogEntry } = await import('../../pages/logging/log-entry.js')
          return <LogEntry id={match.params.id} />
        }}
      />
    )
  },
}

export const loggingRoutes = {
  [LogEntriesTerminalRoute.url]: LogEntriesTerminalRoute,
  [logEntryRoute.url]: logEntryRoute,
}
