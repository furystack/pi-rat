import { createComponent } from '@furystack/shades'
import { Login } from '../../pages/login.js'
import { Register } from '../../pages/register.js'

export const registerRoute = {
  url: '/register',
  component: () => <Register />,
}

export const defaultAuthRoute = {
  url: '',
  component: () => <Login />,
}

export const authRoutes = {
  [registerRoute.url]: registerRoute,
  [defaultAuthRoute.url]: defaultAuthRoute,
}
