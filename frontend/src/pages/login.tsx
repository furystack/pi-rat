import { Shade, createComponent } from '@furystack/shades'
import { SessionService } from '../services/session'
import { Button, Input, Loader, Paper } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'

export const LoginButton = Shade({
  shadowDomName: 'shade-login-button',
  render: ({ useObservable, injector, element }) => {
    const sessionService = injector.getInstance(SessionService)
    const [isOperationInProgress] = useObservable(
      'isOperationInProgress',
      sessionService.isOperationInProgress,
      () => {
        element
          .querySelectorAll('input')
          .forEach((input) => input.setAttribute('disabled', isOperationInProgress.toString()))
      },
      true,
    )
    return (
      <Button
        variant="contained"
        className="login-button"
        disabled={isOperationInProgress}
        type="submit"
        onclick={(ev) => (ev.target as HTMLElement)?.closest('form')?.requestSubmit()}>
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

export const Login = Shade({
  shadowDomName: 'shade-login',
  render: ({ injector, useDisposable, useObservable }) => {
    const sessionService = injector.getInstance(SessionService)

    const postData = useDisposable('postData', () => new ObservableValue({ userName: '', password: '' }))

    const [isOperationInProgress] = useObservable('isOperationInProgress', sessionService.isOperationInProgress)
    const [error] = useObservable('loginError', sessionService.loginError)

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
          <form
            className="login-form"
            onsubmit={(ev) => {
              ev.preventDefault()
              const { userName, password } = postData.getValue()
              sessionService.login(userName, password)
            }}>
            <h2>Login</h2>
            <Input
              labelTitle="User name"
              name="username"
              autofocus
              required
              disabled={isOperationInProgress}
              placeholder="The user's login name"
              value={postData.getValue().userName}
              onTextChange={(value) => postData.setValue({ ...postData.getValue(), userName: value })}
              type="text"
            />
            <Input
              labelTitle="Password"
              name="password"
              required
              disabled={isOperationInProgress}
              placeholder="The password for the user"
              value={postData.getValue().password}
              type="password"
              onTextChange={(value) => postData.setValue({ ...postData.getValue(), password: value })}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexDirection: 'row',
                padding: '1em 0',
              }}>
              {error ? <div style={{ color: 'red', fontSize: '12px' }}>{error}</div> : <div />}
              <LoginButton />
              <button type="submit" style={{ display: 'none' }} />
            </div>
            <p style={{ fontSize: '10px' }}>You can login with the default 'testuser' / 'password' credentials</p>
          </form>
        </Paper>
      </div>
    )
  },
})
