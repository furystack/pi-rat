/** ToDo: Main entry point */

import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { useLogging, VerboseConsoleLogger } from '@furystack/logging'
import { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { Layout } from './components/layout.js'
import { environmentOptions } from './environment-options.js'
import { ThemeProviderService } from '@furystack/shades-common-components'
import { SessionService } from './services/session.js'
import { IdentityContext } from '@furystack/core'
import { darkTheme } from './themes/dark.js'

const shadeInjector = new Injector()

useLogging(shadeInjector, VerboseConsoleLogger)

shadeInjector.getInstance(ThemeProviderService).setAssignedTheme(darkTheme)

shadeInjector.getInstance(SessionService).init()

shadeInjector.setExplicitInstance(shadeInjector.getInstance(SessionService), IdentityContext)

getLogger(shadeInjector).withScope('Startup').verbose({
  message: 'Initializing Shade Frontend...',
  data: { environmentOptions },
})

const rootElement: HTMLDivElement = document.getElementById('root') as HTMLDivElement

initializeShadeRoot({
  injector: shadeInjector,
  rootElement,
  jsxElement: <Layout />,
})
