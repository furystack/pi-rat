import { createComponent, type Route } from '@furystack/shades'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'
import { onLeave, onVisit } from './route-animations.js'

export const userSettingsRoute = {
  url: '/user/settings',
  onVisit,
  onLeave,
  component: () => {
    return (
      <PiRatLazyLoad
        component={async () => {
          const { UserSettingsPage } = await import('../../pages/user/settings.js')
          return <UserSettingsPage />
        }}
      />
    )
  },
} satisfies Route<unknown>

export const userRoutes = [userSettingsRoute] as const
