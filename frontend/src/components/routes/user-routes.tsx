import { createComponent } from '@furystack/shades'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'

export const userSettingsRoute = {
  url: '/user/settings',
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
}

export const userRoutes = {
  [userSettingsRoute.url]: userSettingsRoute,
}
