import type { Injector } from '@furystack/inject'
import { Injectable } from '@furystack/inject'
import type { NestedRoute } from '@furystack/shades'
import { LocationService } from '@furystack/shades'

export type NavigateToEntityRouteOptions = {
  queryString?: string
  replace?: boolean
}

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

  public navigateToEntityRoute(injector: Injector, path: string, options?: NavigateToEntityRouteOptions) {
    if (!(path in this.entityRoutes)) {
      console.warn(`[EntityRouteRegistry] Navigating to unregistered entity route '${path}'`)
    }
    const fullPath = `/entities${path}${options?.queryString ? `?${options.queryString}` : ''}`
    const locationService = injector.getInstance(LocationService)
    if (options?.replace) {
      locationService.replace(fullPath)
    } else {
      locationService.navigate(fullPath)
    }
  }
}
