import { createComponent, type Route } from '@furystack/shades'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'
import { onLeave, onVisit } from './route-animations.js'

export const appSettingsRoute = {
  url: '/app-settings',
  routingOptions: {
    end: false,
  },
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

export const adminRoutes = [appSettingsRoute] as const
