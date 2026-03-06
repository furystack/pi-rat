import { createComponent } from '@furystack/shades'
import { icons } from '@furystack/shades-common-components'
import { PiRatLazyLoad } from '../components/pirat-lazy-load.js'

export const userRoute = {
  meta: { title: 'User', icon: icons.user },
  component: ({ outlet }: { outlet?: JSX.Element }) => (
    <PiRatLazyLoad
      component={async () => {
        const { RouteIndexPage } = await import('../components/route-index-page.js')
        return <RouteIndexPage outlet={outlet} />
      }}
    />
  ),
  children: {
    '/settings': {
      meta: { title: 'Settings', icon: icons.settings },
      component: () => (
        <PiRatLazyLoad
          component={async () => {
            const { UserSettingsPage } = await import('../pages/user/settings.js')
            return <UserSettingsPage />
          }}
        />
      ),
    },
    '/': {
      component: () => <></>,
      routingOptions: { end: false },
    },
  },
}
