import type { Injector } from '@furystack/inject'

/**
 * Registers the IoT plugin's frontend contributions.
 *
 * Phase 2 TODO: Move IoT pages, components, and services from the core frontend
 * into this package. Currently, IoT frontend registrations are handled by
 * registerIotFrontend() in the core frontend because the page components depend
 * on shared core utilities (PiRatLazyLoad, GenericEditor, AppLink, etc.) that
 * haven't been extracted into a shared package yet.
 *
 * Once shared frontend utilities are extracted, this function will:
 * - Register IoT routes via RouteRegistry
 * - Register device-availability widget via WidgetRegistry
 * - Register IoT settings via SettingsRegistry
 * - Register IoT entity routes via EntityRouteRegistry
 */
export const registerIotPlugin = (_injector: Injector) => {
  // Placeholder for Phase 2 - see registerIotFrontend() in the core frontend
}
