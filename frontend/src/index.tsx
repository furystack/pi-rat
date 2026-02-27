/** ToDo: Main entry point */

import { IdentityContext } from '@furystack/core'
import { EntitySyncService, createInMemoryCacheStore } from '@furystack/entity-sync-client'
import { Injector } from '@furystack/inject'
import { getLogger, useLogging, VerboseConsoleLogger } from '@furystack/logging'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'
import { AiChatMessage, Chat, ChatMessage, LogEntry } from 'common'
import { Layout } from './components/layout.js'
import { environmentOptions } from './environment-options.js'
import { SessionService } from './services/session.js'
import { darkTheme } from './themes/dark.js'

const shadeInjector = new Injector()

useLogging(shadeInjector, VerboseConsoleLogger)

shadeInjector.getInstance(ThemeProviderService).setAssignedTheme(darkTheme)

const syncWsUrl = new URL(`${environmentOptions.serviceUrl}/sync`, window.location.href)
  .toString()
  .replace('http', 'ws')

const syncService = new EntitySyncService({
  wsUrl: syncWsUrl,
  localStore: createInMemoryCacheStore(),
})

syncService.registerModel(Chat)
syncService.registerModel(ChatMessage)
syncService.registerModel(LogEntry, { suspendDelayMs: 5000 })
syncService.registerModel(AiChatMessage)

shadeInjector.setExplicitInstance(syncService)

void shadeInjector.getInstance(SessionService).init()

shadeInjector.setExplicitInstance(shadeInjector.getInstance(SessionService), IdentityContext)

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
