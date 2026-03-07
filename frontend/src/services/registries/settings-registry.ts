import { Injectable } from '@furystack/inject'
import type { NestedRoute } from '@furystack/shades'

@Injectable({ lifetime: 'singleton' })
export class SettingsRegistry {
  private settingsRoutes: Record<string, NestedRoute<unknown>> = {}

  public registerSettingsRoute(path: string, route: NestedRoute<unknown>) {
    if (path in this.settingsRoutes) {
      console.warn(`[SettingsRegistry] Settings route '${path}' is already registered and will be overwritten`)
    }
    this.settingsRoutes[path] = route
  }

  public getSettingsRoutes(): Record<string, NestedRoute<unknown>> {
    return { ...this.settingsRoutes }
  }
}
