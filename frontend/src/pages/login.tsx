import { Shade, createComponent } from '@furystack/shades'
import { Button, Form, Input, cssVariableTheme, promisifyAnimation } from '@furystack/shades-common-components'
import { PiRatLogo } from '../components/pi-rat-logo.js'
import { navigateToRoute } from '../utils/navigate-to-route.js'
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
  customElementName: 'shade-login',
  css: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 80px)',
    padding: '24px',

    '& .login-card': {
      width: '100%',
      maxWidth: '420px',
      padding: '48px 40px',
      background: cssVariableTheme.action.backdrop,
      backdropFilter: `blur(${cssVariableTheme.effects.blurMd})`,
      borderRadius: cssVariableTheme.shape.borderRadius.md,
      border: `1px solid ${cssVariableTheme.action.subtleBorder}`,
      boxShadow: cssVariableTheme.shadows.lg,
      transform: 'scale(0.95)',
      opacity: '0',
    },

    '& .login-header': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '32px',
    },

    '& .login-logo': {
      marginBottom: '16px',
      filter: `drop-shadow(${cssVariableTheme.shadows.md})`,
    },

    '& .login-title': {
      fontSize: cssVariableTheme.typography.fontSize.lg,
      fontWeight: '600',
      color: cssVariableTheme.text.primary,
      margin: '0 0 6px 0',
    },

    '& .login-subtitle': {
      fontSize: cssVariableTheme.typography.fontSize.sm,
      color: cssVariableTheme.text.secondary,
      margin: '0',
    },

    '& .login-form': {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },

    '& .login-error': {
      padding: '10px 14px',
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
      backgroundColor: cssVariableTheme.palette.error.light,
      color: cssVariableTheme.palette.error.dark,
      fontSize: cssVariableTheme.typography.fontSize.sm,
      border: `1px solid ${cssVariableTheme.palette.error.main}`,
    },

    '& .login-actions': {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginTop: '8px',
    },

    '& .login-divider': {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
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
  },
  render: ({ injector, useObservable, useRef, useDisposable }) => {
    const sessionService = injector.getInstance(SessionService)
    const [isOperationInProgress] = useObservable('isOperationInProgress', sessionService.isOperationInProgress)
    const [loginError] = useObservable('loginError', sessionService.loginError)
    const cardRef = useRef<HTMLElement>('card')

    useDisposable('entryAnimation', () => {
      const id = setTimeout(() => {
        const el = cardRef.current
        if (el) {
          void promisifyAnimation(
            el,
            [
              { transform: 'scale(0.95)', opacity: '0' },
              { transform: 'scale(1)', opacity: '1' },
            ],
            { duration: 400, fill: 'forwards', easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
          )
        }
      }, 50)
      return { [Symbol.dispose]: () => clearTimeout(id) }
    })

    return (
      <div ref={cardRef} className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <PiRatLogo size={80} />
          </div>
          <h2 className="login-title">Welcome to PI-Rat</h2>
          <p className="login-subtitle">Sign in to continue</p>
        </div>

        <Form<LoginPayload>
          validate={isLoginPayload}
          className="login-form"
          onSubmit={({ userName, password }) => {
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
      </div>
    )
  },
})
