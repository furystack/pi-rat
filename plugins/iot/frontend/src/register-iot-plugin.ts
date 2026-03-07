import type { Injector } from '@furystack/inject'

/**
 * Registers the IoT plugin's frontend contributions.
 *
 * Currently a placeholder that will be populated when IoT frontend code
 * is fully migrated to this package. For now, IoT routes/widgets/settings/entities
 * are still registered via registerCorePlugins() in the main frontend package.
 */
export const registerIotPlugin = (_injector: Injector) => {
  // IoT frontend registrations will be moved here from registerCorePlugins()
  // when the IoT pages, components, and services are migrated to this package.
}
