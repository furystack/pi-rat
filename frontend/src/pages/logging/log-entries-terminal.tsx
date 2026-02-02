import type { CacheResult } from '@furystack/cache'
import type { GetCollectionResult } from '@furystack/rest'
import { Shade, type RenderOptions } from '@furystack/shades'
import { FitAddon } from '@xterm/addon-fit'
import { SearchAddon } from '@xterm/addon-search'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import type { LogEntry } from 'common'
import { compile, match, type MatchResult } from 'path-to-regexp'
import { logEntryRoute } from '../../components/routes/logging-routes.js'
import { navigateToRoute } from '../../navigate-to-route.js'
import { LoggingService } from '../../services/logging-service.js'

const useDisposableTerminal = ({ useDisposable, element, injector }: RenderOptions<any>) => {
  return useDisposable('terminal', () => {
    const terminal = new Terminal({
      linkHandler: {
        activate: (ev: MouseEvent, url: string) => {
          const { pathname } = new URL(url)
          const id = (match(logEntryRoute.url)(pathname) as MatchResult<{ id: string }>)?.params?.id
          if (id) {
            ev.preventDefault()
            ev.stopPropagation()
            navigateToRoute(injector, logEntryRoute, { id })
          }
          return true
        },
      },
    })
    const fitAddon = new FitAddon()
    const searchAddon = new SearchAddon()
    const webLinksAddon = new WebLinksAddon()
    terminal.loadAddon(fitAddon)
    terminal.loadAddon(searchAddon)
    terminal.loadAddon(webLinksAddon)
    terminal.open(element)
    fitAddon.fit()

    return {
      terminal,
      webLinksAddon,
      fitAddon,
      searchAddon,
      [Symbol.dispose]: () => terminal.dispose(),
    }
  })
}

const fillTerminalWithLogEntries = (terminal: Terminal, logEntries: CacheResult<GetCollectionResult<LogEntry>>) => {
  terminal.clear()
  terminal.write('\r\n\r\n\r\n\r\n***** LOG ENTRIES *****\r\n')

  const maxScopeLength = Math.max(...(logEntries.value?.entries.map((logEntry) => logEntry.scope.length) ?? [0]))

  logEntries.value?.entries.forEach((logEntry) => {
    const timestamp = new Date(logEntry.createdAt).toISOString()
    const coloredLevelSymbol =
      logEntry.level === 'error'
        ? '\x1B[31mE\x1B[0m'
        : logEntry.level === 'warning'
          ? '\x1B[33mW\x1B[0m'
          : logEntry.level === 'fatal'
            ? '\x1B[35mF\x1B[0m'
            : logEntry.level === 'verbose'
              ? '\x1B[34mV\x1B[0m'
              : logEntry.level === 'debug'
                ? '\x1B[36mD\x1B[0m'
                : '\x1B[32mI\x1B[0m'

    // Try the OSC8 link syntax

    const url = compile(logEntryRoute.url)({ id: logEntry.id })

    const showMoreLink = `\x1B]8;;${window.location.origin}${url}\x1B\\[show more]\x1B]8;;\x1B\\`
    terminal.write(
      `${timestamp} | ${coloredLevelSymbol} | ${logEntry.scope.padEnd(maxScopeLength)} | ${logEntry.message} ${showMoreLink}\r\n`,
    )
  })
}

const useLogEntries = ({ injector, useObservable }: RenderOptions<any>, terminal: Terminal) => {
  return useObservable(
    'logEntries',
    injector.getInstance(LoggingService).findLogEntryAsObservable({
      order: { createdAt: 'DESC' },
    }),
    {
      onChange: (logEntries) => {
        fillTerminalWithLogEntries(terminal, logEntries)
      },
    },
  )
}

export const LogEntriesTerminal = Shade({
  shadowDomName: 'shade-app-log-entries-terminal-page',
  css: {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
  },
  constructed: (renderOptions) => {
    const { terminal } = useDisposableTerminal(renderOptions)
    const [entries] = useLogEntries(renderOptions, terminal)

    fillTerminalWithLogEntries(terminal, entries)
  },
  render: () => {
    return null
  },
})
