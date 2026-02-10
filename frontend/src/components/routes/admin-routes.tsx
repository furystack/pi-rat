import { createComponent } from '@furystack/shades'
import { PiRatLazyLoad } from '../pirat-lazy-load.js'

export const appSettingsRoute = {
  url: '/app-settings',
  routingOptions: {
    end: false,
  },
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
}

export const adminRoutes = {
  [appSettingsRoute.url]: appSettingsRoute,
}
