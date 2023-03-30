import type { Injector } from '@furystack/inject'

export interface Patch {
  id: string
  name: string
  description: string
  run: (injector: Injector, addLogEntry: (message: string) => void) => Promise<void>
}
