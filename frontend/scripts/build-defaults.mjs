import { pnpPlugin } from '@yarnpkg/esbuild-plugin-pnp'

export const getBundleBuildOptions = () => ({
  plugins: [pnpPlugin()],
  entryPoints: ['./src/index.tsx'],
  jsxFactory: 'createComponent',
  outdir: 'bundle/js',
  bundle: true,
  minify: false,
  sourcemap: true,
  splitting: true,
  platform: 'browser',
  format: 'esm',
  loader: {
    '.ttf': 'dataurl',
    '.css': 'css',
    '.png': 'dataurl',
  },
  external: ['data:image'],
})
