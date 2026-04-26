import { defineService, type Token } from '@furystack/inject'

export interface ExternalServiceStatusRegistry {
  register(name: string, statusGetter: () => boolean): void
  getStatuses(): Record<string, boolean>
}

export const ExternalServiceStatusRegistry: Token<ExternalServiceStatusRegistry, 'singleton'> = defineService({
  name: 'pi-rat/ExternalServiceStatusRegistry',
  lifetime: 'singleton',
  factory: () => {
    const providers = new Map<string, () => boolean>()
    return {
      register: (name, statusGetter) => {
        providers.set(name, statusGetter)
      },
      getStatuses: () => {
        const result: Record<string, boolean> = {}
        for (const [name, getter] of providers) {
          result[name] = getter()
        }
        return result
      },
    }
  },
})
