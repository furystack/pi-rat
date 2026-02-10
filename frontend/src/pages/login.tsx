import { Shade, createComponent } from '@furystack/shades'
import { Button, Form, Input, Paper } from '@furystack/shades-common-components'
import { registerRoute } from '../components/routes/auth-routes.js'
import { navigateToRoute } from '../navigate-to-route.js'
import { SessionService } from '../services/session.js'

type LoginPayload = {
  userName: string
  password: string
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
          validate={(plainData): plainData is LoginPayload => {
            return !!(plainData as LoginPayload)?.userName?.length && !!(plainData as LoginPayload)?.password?.length
          }}
          className="login-form"
          onSubmit={({ userName, password }) => void sessionService.login(userName, password)}
        >
          <h2>Login</h2>
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
              onclick={() => navigateToRoute(injector, registerRoute, {})}
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
