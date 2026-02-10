import { createComponent } from '@furystack/shades'
import { Login } from '../../pages/login.js'
import { Register } from '../../pages/register.js'
import { onLeave, onVisit } from './route-animations.js'

export const registerRoute = {
  url: '/register',
  onVisit,
  onLeave,
  component: () => <Register />,
}

export const defaultAuthRoute = {
  url: '',
  onVisit,
  onLeave,
  component: () => <Login />,
}

export const authRoutes = {
  [registerRoute.url]: registerRoute,
  [defaultAuthRoute.url]: defaultAuthRoute,
}
