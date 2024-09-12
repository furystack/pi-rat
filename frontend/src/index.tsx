/** ToDo: Main entry point */

import { IdentityContext } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { getLogger, useLogging, VerboseConsoleLogger } from '@furystack/logging'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'
import { Layout } from './components/layout.js'
import { environmentOptions } from './environment-options.js'
import { SessionService } from './services/session.js'
import { darkTheme } from './themes/dark.js'

const shadeInjector = new Injector()

useLogging(shadeInjector, VerboseConsoleLogger)

shadeInjector.getInstance(ThemeProviderService).setAssignedTheme(darkTheme)

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
