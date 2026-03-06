import { createComponent } from '@furystack/shades'
import { icons } from '@furystack/shades-common-components'
import { PiRatLazyLoad } from '../components/pirat-lazy-load.js'

export const authRoutes = {
  '/about': {
    meta: { title: 'About', icon: icons.info },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { AboutPage } = await import('../pages/about.js')
          return <AboutPage />
        }}
      />
    ),
  },
  '/register': {
    meta: { title: 'Register', icon: icons.user },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { Register } = await import('../pages/register.js')
          return <Register />
        }}
      />
    ),
  },
  '': {
    meta: { title: 'Login', icon: icons.lock },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { Login } = await import('../pages/login.js')
          return <Login />
        }}
      />
    ),
  },
}
