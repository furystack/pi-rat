import { createComponent, type Route } from '@furystack/shades'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'
import { onLeave, onVisit } from './route-animations.js'


const appSettingsPageComponent = () => {
  return (
    <PiRatLazyLoad
      component={async () => {
        const { AppSettingsPage } = await import('../../pages/admin/app-settings.js')
        return <AppSettingsPage />
      }}
    />
  )
}

export const appSettingsOmdbRoute = {
  url: '/app-settings/omdb',
  onVisit,
  onLeave,
  component: appSettingsPageComponent,
} satisfies Route<unknown>

export const appSettingsStreamingRoute = {
  url: '/app-settings/streaming',
  onVisit,
  onLeave,
  component: appSettingsPageComponent,
} satisfies Route<unknown>

export const appSettingsRoute = {
  url: '/app-settings',
  routingOptions: {
    end: false,

  },
  onVisit,
  onLeave,
  component: appSettingsPageComponent,
} satisfies Route<unknown>

export const adminRoutes = [
  // appSettingsOmdbRoute,
  // appSettingsStreamingRoute,
  appSettingsRoute,
] as const
