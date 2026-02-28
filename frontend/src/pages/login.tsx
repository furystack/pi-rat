import { Shade, createComponent } from '@furystack/shades'
import { Button, Form, Input, Paper, Typography } from '@furystack/shades-common-components'
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
    padding: '1em',
    marginTop: '48px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '& .button-row': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexDirection: 'row',
      padding: '1em 0',
    },
  },
  render: ({ injector, useObservable }) => {
    const sessionService = injector.getInstance(SessionService)
    const [isOperationInProgress] = useObservable('isOperationInProgress', sessionService.isOperationInProgress)
    return (
      <Paper elevation={3} style={{ flexGrow: '1' }}>
        <Form<LoginPayload>
          validate={isLoginPayload}
          className="login-form"
          onSubmit={({ userName, password }) => void sessionService.login(userName, password)}
        >
          <Typography variant="h2">Login</Typography>
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
          <div className="button-row">
            <Button variant="contained" color="primary" type="submit" disabled={isOperationInProgress}>
              Login
            </Button>
            <Button
              variant="outlined"
              onclick={() => navigateToRoute(injector, '/register')}
              disabled={isOperationInProgress}
            >
              Create Account
            </Button>
          </div>
        </Form>
      </Paper>
    )
  },
})
