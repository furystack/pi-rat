import type { Injector } from '@furystack/inject'
import { useStaticFiles } from '@furystack/rest-service'
import { join, sep } from 'path'

export const setupFrontendBundle = async (injector: Injector) => {
  await useStaticFiles({
    injector,
    baseUrl: '',
    fallback: 'index.html',
    path: join(process.cwd(), '..', 'frontend', 'dist') + sep,
    port: 9090,
  })
}
