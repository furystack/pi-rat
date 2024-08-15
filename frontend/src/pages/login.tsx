import { Shade, createComponent } from '@furystack/shades'
import { Button, Form, Input, Paper } from '@furystack/shades-common-components'
import { SessionService } from '../services/session.js'

type LoginPayload = {
  userName: string
  password: string
}

export const Login = Shade({
  shadowDomName: 'shade-login',
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
        <Form<LoginPayload>
          validate={(plainData): plainData is LoginPayload => {
            return !!(plainData as LoginPayload)?.userName?.length && !!(plainData as LoginPayload)?.password?.length
          }}
          className="login-form"
          onSubmit={({ userName, password }) => void sessionService.login(userName, password)}
        >
          <h2>Login</h2>
          <Input labelTitle="E-mail address" name="userName" required autofocus type="email" />
          <Input labelTitle="Password" name="password" required minLength={4} type="password" />
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
              Login
            </Button>
          </div>
        </Form>
      </Paper>
    )
  },
})
