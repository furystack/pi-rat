import { Injectable } from '@furystack/inject'
import type { NestedRoute } from '@furystack/shades'

@Injectable({ lifetime: 'singleton' })
export class EntityRouteRegistry {
  private entityRoutes: Record<string, NestedRoute<unknown>> = {}

  public registerEntityRoute(path: string, route: NestedRoute<unknown>) {
    if (path in this.entityRoutes) {
      console.warn(`[EntityRouteRegistry] Entity route '${path}' is already registered and will be overwritten`)
    }
    this.entityRoutes[path] = route
  }

  public getEntityRoutes(): Record<string, NestedRoute<unknown>> {
    return { ...this.entityRoutes }
  }
}
