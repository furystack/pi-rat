/** ToDo: Main entry point */
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { useLogging, VerboseConsoleLogger } from '@furystack/logging'
import { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { Layout } from './components/layout'
import { environmentOptions } from './environment-options'

const shadeInjector = new Injector()

useLogging(shadeInjector, VerboseConsoleLogger)

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
