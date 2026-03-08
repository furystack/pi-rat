import { Injectable } from '@furystack/inject'
import type { NestedRoute } from '@furystack/shades'

@Injectable({ lifetime: 'singleton' })
export class RouteRegistry {
  private pluginRoutes = new Map<`/${string}`, NestedRoute<unknown>>()

  public registerRoutes(routes: Record<`/${string}`, NestedRoute<unknown>>) {
    for (const [key, value] of Object.entries(routes) as Array<[`/${string}`, NestedRoute<unknown>]>) {
      if (this.pluginRoutes.has(key)) {
        console.warn(`[RouteRegistry] Route '${key}' is already registered and will be overwritten`)
      }
      this.pluginRoutes.set(key, value)
    }
  }

  public getRoutes(): Record<`/${string}`, NestedRoute<unknown>> {
    return Object.fromEntries(this.pluginRoutes) as Record<`/${string}`, NestedRoute<unknown>>
  }
}
