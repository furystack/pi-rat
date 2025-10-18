import { Shade, createComponent } from '@furystack/shades'
import { Button, Form, Input, Paper } from '@furystack/shades-common-components'
import { loginRoute } from '../components/routes/auth-routes.js'
import { navigateToRoute } from '../navigate-to-route.js'
import { SessionService } from '../services/session.js'

type RegisterPayload = {
  userName: string
  password: string
  confirmPassword: string
}

export const Register = Shade({
  shadowDomName: 'shade-register',
  constructed: ({ element }) => {
    element.querySelector<HTMLInputElement>('input[autofocus]')?.focus()
  },
  render: ({ injector, useObservable, element }) => {
    const sessionService = injector.getInstance(SessionService)
    useObservable('isOperationInProgress', sessionService.isOperationInProgress, {
      onChange: (isOperationInProgress) => {
        const els = [...element.querySelectorAll('input').values(), ...element.querySelectorAll('button').values()]
        els.forEach((el) => {
          el.disabled = isOperationInProgress
        })
        if (!isOperationInProgress) {
          element.querySelector<HTMLInputElement>('input[autofocus]')?.focus()
        }
      },
    })
    Object.assign(element.style, {
      padding: '1em',
      marginTop: '48px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    })
    return (
      <Paper elevation={3} style={{ flexGrow: '1' }}>
        <Form<RegisterPayload>
          validate={(plainData): plainData is RegisterPayload => {
            const data = plainData as RegisterPayload
            return !!(
              data?.userName?.length &&
              data?.password?.length &&
              data?.confirmPassword?.length &&
              data.password === data.confirmPassword
            )
          }}
          className="register-form"
          onSubmit={({ userName, password, confirmPassword }) => {
            if (password !== confirmPassword) {
              sessionService.loginError.setValue('Passwords do not match')
              return
            }
            void sessionService.register(userName, password)
          }}
        >
          <h2>Create Account</h2>
          <Input labelTitle="E-mail address" name="userName" required autofocus type="email" />
          <Input labelTitle="Password" name="password" required minLength={6} type="password" />
          <Input labelTitle="Confirm Password" name="confirmPassword" required minLength={6} type="password" />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: 'row',
              padding: '1em 0',
            }}
          >
            <Button variant="contained" color="primary" type="submit">
              Create Account
            </Button>
            <Button variant="outlined" onclick={() => navigateToRoute(injector, loginRoute, {})}>
              Back to Login
            </Button>
          </div>
        </Form>
      </Paper>
    )
  },
})
