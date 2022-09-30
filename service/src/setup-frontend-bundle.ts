import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { useStaticFiles } from '@furystack/rest-service'
import { join, sep } from 'path'

export const setupFrontendBundle = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('FrontendBundle')
  logger.information({ message: '📦  Setting up frontend bundle...' })

  await useStaticFiles({
    injector,
    baseUrl: '',
    fallback: 'index.html',
    path: join(process.cwd(), '..', 'frontend', 'bundle') + sep,
    port: 9090,
  })
  logger.information({ message: '✅  Frontend bundle setup completed' })
}
