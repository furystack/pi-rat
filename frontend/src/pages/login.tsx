import { Shade, createComponent } from '@furystack/shades'
import { SessionService } from '../services/session.js'
import { Button, Form, Input, Loader, Paper } from '@furystack/shades-common-components'

export const LoginButton = Shade({
  shadowDomName: 'shade-login-button',
  render: ({ useObservable, injector }) => {
    const sessionService = injector.getInstance(SessionService)
    const [isOperationInProgress] = useObservable('isOperationInProgress', sessionService.isOperationInProgress)
    return (
      <Button variant="contained" className="login-button" disabled={isOperationInProgress} type="submit">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyItems: 'center',
          }}>
          Login
          {isOperationInProgress ? (
            <Loader
              style={{
                width: '20px',
                height: '20px',
              }}
            />
          ) : null}
        </div>
      </Button>
    )
  },
})

type LoginPayload = {
  userName: string
  password: string
}

export const Login = Shade({
  shadowDomName: 'shade-login',
  render: ({ injector, useObservable, element }) => {
    const sessionService = injector.getInstance(SessionService)
    useObservable('isOperationInProgress', sessionService.isOperationInProgress, {
      onChange: (isOperationInProgress) => {
        const els = [...element.querySelectorAll('input').values(), ...element.querySelectorAll('button').values()]
        els.forEach((el) => {
          el.disabled = isOperationInProgress
        })
      },
    })

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100% - 64px)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 100px',
          paddingTop: '100px',
        }}>
        <Paper elevation={3}>
          <Form<LoginPayload>
            validate={(plainData: any): plainData is LoginPayload => {
              return plainData?.userName?.length && plainData?.password?.length
            }}
            className="login-form"
            onSubmit={({ userName, password }) => sessionService.login(userName, password)}>
            <h2>Login</h2>
            <Input
              labelTitle="User name"
              name="userName"
              autofocus
              required
              // disabled={isOperationInProgress}
              getHelperText={() => "The user's login name"}
              type="text"
            />
            <Input
              labelTitle="Password"
              name="password"
              required
              // disabled={isOperationInProgress}
              getHelperText={() => 'The password for the user'}
              type="password"
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexDirection: 'row',
                padding: '1em 0',
              }}>
              {/* {error ? <div style={{ color: 'red', fontSize: '12px' }}>{error}</div> : <div />} */}
              <LoginButton />
              <button type="submit" style={{ display: 'none' }} />
            </div>
          </Form>
        </Paper>
      </div>
    )
  },
})
