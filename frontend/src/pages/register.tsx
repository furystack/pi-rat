import { Shade, createComponent } from '@furystack/shades'
import { Button, cssVariableTheme, Form, Input } from '@furystack/shades-common-components'

import { AuthLayout } from '../components/auth-layout.js'
import { navigateToRoute } from '../navigate-to-route.js'
import { SessionService } from '../services/session.js'

export type RegisterPayload = {
  userName: string
  password: string
  confirmPassword: string
}

export const isRegisterPayload = (data: unknown): data is RegisterPayload => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return (
    typeof d.userName === 'string' &&
    d.userName.length > 0 &&
    typeof d.password === 'string' &&
    d.password.length > 0 &&
    typeof d.confirmPassword === 'string' &&
    d.confirmPassword.length > 0 &&
    d.password === d.confirmPassword
  )
}

export const Register = Shade({
  shadowDomName: 'shade-register',
  css: {
    '& .register-form': {
      display: 'flex',
      flexDirection: 'column',
      gap: cssVariableTheme.spacing.md,
    },

    '& .register-actions': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexDirection: 'row',
      paddingTop: cssVariableTheme.spacing.sm,
    },
  },
  render: ({ injector, useObservable }) => {
    const sessionService = injector.getInstance(SessionService)
    const [isOperationInProgress] = useObservable('isOperationInProgress', sessionService.isOperationInProgress)

    return (
      <AuthLayout title="Create Account" subtitle="Join PI-Rat to get started">
        <Form<RegisterPayload>
          validate={isRegisterPayload}
          className="register-form"
          onSubmit={({ userName, password }) => {
            void sessionService.register(userName, password)
          }}
        >
          <Input
            labelTitle="E-mail address"
            name="userName"
            required
            autofocus
            type="email"
            disabled={isOperationInProgress}
          />
          <Input
            labelTitle="Password"
            name="password"
            required
            minLength={6}
            type="password"
            disabled={isOperationInProgress}
          />
          <Input
            labelTitle="Confirm Password"
            name="confirmPassword"
            required
            minLength={6}
            type="password"
            disabled={isOperationInProgress}
          />
          <div className="register-actions">
            <Button variant="contained" color="primary" type="submit" disabled={isOperationInProgress}>
              Create Account
            </Button>
            <Button variant="outlined" onclick={() => navigateToRoute(injector, '/')} disabled={isOperationInProgress}>
              Back to Login
            </Button>
          </div>
        </Form>
      </AuthLayout>
    )
  },
})
