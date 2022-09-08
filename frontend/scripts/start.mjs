import { serve } from 'esbuild'
import { createServer, request } from 'http'
import { getBundleBuildOptions } from './build-defaults.mjs'

const onRequest = (bundler) => (arg) => {
  console.log(`[${bundler}] <${arg.status}> ${arg.path}`)
}

serve(
  {
    servedir: 'bundle',
    port: 8080,
    onRequest: onRequest('bundle'),
  },
  {
    ...getBundleBuildOptions(),
  },
)
