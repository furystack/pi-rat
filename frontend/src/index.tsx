/** ToDo: Main entry point */

import { IdentityContext } from '@furystack/core'
import { createInjector } from '@furystack/inject'
import { getLogger, useLogging, VerboseConsoleLogger } from '@furystack/logging'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'
import { AiChatMessage, Chat, ChatMessage, LogEntry } from 'common'
import { Layout } from './components/layout.js'
import { AppEntitySync } from './services/entity-sync.js'
import { SessionService } from './services/session.js'
import { darkTheme } from './themes/dark.js'
import { environmentOptions } from './utils/environment-options.js'
import { registerThemeSwitchCheat } from './utils/theme-switch-cheat.js'

const shadeInjector = createInjector()

useLogging(shadeInjector, VerboseConsoleLogger)

shadeInjector.get(ThemeProviderService).setAssignedTheme(darkTheme)

const syncService = shadeInjector.get(AppEntitySync)
syncService.registerModel(Chat)
syncService.registerModel(ChatMessage)
syncService.registerModel(LogEntry, { suspendDelayMs: 5000 })
syncService.registerModel(AiChatMessage)

const syncLogger = getLogger(shadeInjector).withScope('EntitySync')

syncService.addListener('onConnect', () => {
  void syncLogger.verbose({ message: 'Entity sync connected' })
})

syncService.addListener('onDisconnect', () => {
  void syncLogger.warning({ message: 'Entity sync disconnected' })
})

syncService.addListener('onReconnectAttempt', ({ attempt }) => {
  void syncLogger.warning({ message: `Entity sync reconnecting (attempt ${attempt})` })
})

syncService.addListener('onReconnectFailed', ({ attempt }) => {
  void syncLogger.error({ message: `Entity sync reconnect failed (attempt ${attempt})` })
})

shadeInjector.bind(IdentityContext, () => shadeInjector.get(SessionService))
shadeInjector.get(SessionService)

void getLogger(shadeInjector).withScope('Startup').verbose({
  message: 'Initializing Shade Frontend...',
  data: { environmentOptions },
})

const rootElement: HTMLDivElement = document.getElementById('root') as HTMLDivElement

initializeShadeRoot({
  injector: shadeInjector,
  rootElement,
  jsxElement: <Layout />,
})

registerThemeSwitchCheat(shadeInjector)
