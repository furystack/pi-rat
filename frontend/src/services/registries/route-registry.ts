import { Injectable } from '@furystack/inject'
import type { NestedRoute } from '@furystack/shades'

@Injectable({ lifetime: 'singleton' })
export class RouteRegistry {
  private pluginRoutes: Record<string, NestedRoute<unknown>> = {}

  public registerRoutes(routes: Record<string, NestedRoute<unknown>>) {
    Object.assign(this.pluginRoutes, routes)
  }

  public getRoutes(): Record<string, NestedRoute<unknown>> {
    return { ...this.pluginRoutes }
  }
}
