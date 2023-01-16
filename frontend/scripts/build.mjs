import { context } from 'esbuild'
import { getBundleBuildOptions, getMonacoBuildOptions } from './build-defaults.mjs'

const buildBundle = () =>
  context({
    ...getBundleBuildOptions(),
    minify: true,
    keepNames: true,
  })
    .then((r) => r.rebuild())
    .then((result) => {
      console.log('Building the Bundle successful', { result })
    })
    .catch((error) => {
      console.error('Building the Bundle failed', error)
    })

const buildMonaco = () =>
  context({
    ...getMonacoBuildOptions(),
    minify: true,
    keepNames: true,
  })
    .then((r) => r.rebuild())
    .then((result) => console.log('Building Monaco successful', { result }))
    .catch((error) => {
      console.error('Building Monaco failed', error)
    })

await Promise.all([buildBundle(), buildMonaco()])
  .then(() => process.exit(0))
  .catch(() => {
    process.exit(1)
  })
