import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { useStaticFiles } from '@furystack/rest-service'
import { join } from 'path'

export const setupFrontendBundle = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('FrontendBundle')
  logger.information({ message: '📦  Setting up frontend bundle...' })

  await useStaticFiles({
    injector,
    baseUrl: '/',
    path: join(process.cwd(), '..', 'frontend', 'bundle'),
    port: 9090,
    fallback: 'index.html',
  })
  logger.information({ message: '✅  Frontend bundle setup completed' })
}
