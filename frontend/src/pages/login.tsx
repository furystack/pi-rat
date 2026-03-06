import { Shade, NestedRouteLink, createComponent } from '@furystack/shades'
import { Button, cssVariableTheme, Form, Input } from '@furystack/shades-common-components'

import { AuthLayout } from '../components/auth-layout.js'
import { navigateToRoute } from '../navigate-to-route.js'
import { SessionService } from '../services/session.js'

export type LoginPayload = {
  userName: string
  password: string
}

export const isLoginPayload = (data: unknown): data is LoginPayload => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return (
    typeof d.userName === 'string' && d.userName.length > 0 && typeof d.password === 'string' && d.password.length > 0
  )
}

export const Login = Shade({
  shadowDomName: 'shade-login',
  css: {
    '& .login-form': {
      display: 'flex',
      flexDirection: 'column',
      gap: cssVariableTheme.spacing.md,
    },

    '& .login-error': {
      padding: `${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.md}`,
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
      backgroundColor: cssVariableTheme.palette.error.light,
      color: cssVariableTheme.palette.error.dark,
      fontSize: cssVariableTheme.typography.fontSize.sm,
      border: `1px solid ${cssVariableTheme.palette.error.main}`,
    },

    '& .login-actions': {
      display: 'flex',
      flexDirection: 'column',
      gap: cssVariableTheme.spacing.sm,
      marginTop: cssVariableTheme.spacing.sm,
    },

    '& .login-divider': {
      display: 'flex',
      alignItems: 'center',
      gap: cssVariableTheme.spacing.sm,
      color: cssVariableTheme.text.secondary,
      fontSize: cssVariableTheme.typography.fontSize.sm,
    },

    '& .login-divider::before, & .login-divider::after': {
      content: "''",
      flex: '1',
      height: '1px',
      background: cssVariableTheme.action.subtleBorder,
    },

    '& .register-row': {
      textAlign: 'center',
      color: cssVariableTheme.text.secondary,
      fontSize: cssVariableTheme.typography.fontSize.sm,
    },

    '& .login-footer': {
      textAlign: 'center',
      marginTop: cssVariableTheme.spacing.lg,
    },

    '& .login-footer nested-route-link': {
      color: cssVariableTheme.text.secondary,
      fontSize: cssVariableTheme.typography.fontSize.xs,
      textDecoration: 'none',
    },

    '& .login-footer nested-route-link:hover': {
      color: cssVariableTheme.text.primary,
      textDecoration: 'underline',
    },
  },
  render: ({ injector, useObservable }) => {
    const sessionService = injector.getInstance(SessionService)
    const [isOperationInProgress] = useObservable('isOperationInProgress', sessionService.isOperationInProgress)
    const [loginError] = useObservable('loginError', sessionService.loginError)

    return (
      <AuthLayout title="Welcome to PI-Rat" subtitle="Sign in to continue">
        <Form<LoginPayload>
          validate={isLoginPayload}
          className="login-form"
          onSubmit={({ userName, password }) => {
            sessionService.loginError.setValue('')
            void sessionService.login(userName, password)
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
            minLength={4}
            type="password"
            disabled={isOperationInProgress}
          />

          {loginError ? <div className="login-error">{loginError}</div> : null}

          <div className="login-actions">
            <Button variant="contained" color="primary" type="submit" disabled={isOperationInProgress}>
              {isOperationInProgress ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="login-divider">or</div>

            <div className="register-row">
              <Button
                variant="outlined"
                onclick={() => navigateToRoute(injector, '/register')}
                disabled={isOperationInProgress}
              >
                Create Account
              </Button>
            </div>
          </div>
        </Form>
        <div className="login-footer">
          <NestedRouteLink href="/about">About PI-Rat</NestedRouteLink>
        </div>
      </AuthLayout>
    )
  },
})
