import { Shade, createComponent } from '@furystack/shades'
import { Button, Form, Input, Paper, Typography } from '@furystack/shades-common-components'
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
  customElementName: 'shade-register',
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
        <Form<RegisterPayload>
          validate={isRegisterPayload}
          className="register-form"
          onSubmit={({ userName, password }) => {
            void sessionService.register(userName, password)
          }}
        >
          <Typography variant="h2">Create Account</Typography>
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
          <div className="button-row">
            <Button variant="contained" color="primary" type="submit" disabled={isOperationInProgress}>
              Create Account
            </Button>
            <Button variant="outlined" onclick={() => navigateToRoute(injector, '/')} disabled={isOperationInProgress}>
              Back to Login
            </Button>
          </div>
        </Form>
      </Paper>
    )
  },
})
