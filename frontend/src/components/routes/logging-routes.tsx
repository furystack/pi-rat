import { createComponent } from '@furystack/shades'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'
import { onLeave, onVisit } from './route-animations.js'

export const LogEntriesTerminalRoute = {
  url: '/logging/terminal',
  onVisit,
  onLeave,
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
  onVisit,
  onLeave,
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
