import { Injectable } from '@furystack/inject'
import type { NestedRoute } from '@furystack/shades'

@Injectable({ lifetime: 'singleton' })
export class SettingsRegistry {
  private settingsRoutes = new Map<`/${string}`, NestedRoute<unknown>>()

  public registerSettingsRoute(path: `/${string}`, route: NestedRoute<unknown>) {
    if (this.settingsRoutes.has(path)) {
      console.warn(`[SettingsRegistry] Settings route '${path}' is already registered and will be overwritten`)
    }
    this.settingsRoutes.set(path, route)
  }

  public getSettingsRoutes(): Record<`/${string}`, NestedRoute<unknown>> {
    return Object.fromEntries(this.settingsRoutes) as Record<`/${string}`, NestedRoute<unknown>>
  }
}
