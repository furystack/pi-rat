import { build } from 'esbuild'
import { getBundleBuildOptions } from './build-defaults.mjs'

const buildBundle = () =>
  build({
    ...getBundleBuildOptions(),
    minify: true,
    keepNames: true,
  })
    .then((result) => {
      console.log('Building the Bundle successful', { result })
    })
    .catch((error) => {
      console.error('Building the Bundle failed', error)
    })

await Promise.all([buildBundle()])
  .then(() => process.exit(0))
  .catch(() => {
    process.exit(1)
  })
