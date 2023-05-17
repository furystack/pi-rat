import { init } from './service.js'

init().catch((err) => {
  console.error('Error during service initialization', err)
  process.exit(1)
})
