import { createComponent } from '@furystack/shades'
import { PiRatLazyLoad } from '../components/pirat-lazy-load.js'

export const authRoutes = {
  '/register': {
    meta: { title: 'Register' },
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
    meta: { title: 'Login' },
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
