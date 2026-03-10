import { Injectable } from '@furystack/inject'

@Injectable({ lifetime: 'singleton' })
export class ExternalServiceStatusRegistry {
  private providers = new Map<string, () => boolean>()

  public register(name: string, statusGetter: () => boolean) {
    this.providers.set(name, statusGetter)
  }

  public getStatuses(): Record<string, boolean> {
    const result: Record<string, boolean> = {}
    for (const [name, getter] of this.providers) {
      result[name] = getter()
    }
    return result
  }
}
