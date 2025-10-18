import { createComponent, type Route } from '@furystack/shades'
import { Login } from '../../pages/login.js'
import { Register } from '../../pages/register.js'
import { onLeave, onVisit } from './route-animations.js'

export const registerRoute = {
  url: '/register',
  onVisit,
  onLeave,
  component: () => <Register />,
} satisfies Route<unknown>

export const defaultAuthRoute = {
  url: '',
  onVisit,
  onLeave,
  component: () => <Login />,
} satisfies Route<unknown>

export const authRoutes = [registerRoute, defaultAuthRoute] as const
