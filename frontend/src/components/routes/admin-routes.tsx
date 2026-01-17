import { createComponent, type Route } from '@furystack/shades'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'
import { onLeave, onVisit } from './route-animations.js'

export const adminSettingsRoute = {
  url: '/admin',
  onVisit,
  onLeave,
  component: () => {
    return (
      <PiRatLazyLoad
        component={async () => {
          const { AdminSettingsPage } = await import('../../pages/admin/settings.js')
          return <AdminSettingsPage />
        }}
      />
    )
  },
} satisfies Route<unknown>

export const appSettingsRoute = {
  url: '/app-settings',
  onVisit,
  onLeave,
  component: () => {
    return (
      <PiRatLazyLoad
        component={async () => {
          const { AppSettingsPage } = await import('../../pages/admin/app-settings.js')
          return <AppSettingsPage />
        }}
      />
    )
  },
} satisfies Route<unknown>

export const adminRoutes = [adminSettingsRoute, appSettingsRoute] as const
