import { Shade, createComponent } from '@furystack/shades'
import { SessionService } from '../services/session'
import { Button, Input, Loader, Paper } from '@furystack/shades-common-components'

export const LoginButton = Shade<{}, { isOperationInProgress?: boolean }>({
  shadowDomName: 'shade-login-button',
  getInitialState: ({ injector }) => ({
    isOperationInProgress: injector.getInstance(SessionService).isOperationInProgress.getValue(),
  }),
  resources: ({ injector, updateState, element }) => {
    const sessionService = injector.getInstance(SessionService)
    return [
      sessionService.isOperationInProgress.subscribe((isOperationInProgress) => {
        updateState({ isOperationInProgress })
        element
          .querySelectorAll('input')
          .forEach((input) => input.setAttribute('disabled', isOperationInProgress.toString()))
      }),
    ]
  },
  render: ({ getState }) => {
    const { isOperationInProgress } = getState()
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

export const Login = Shade<{}, { username: string; password: string; error: string; isOperationInProgress: boolean }>({
  shadowDomName: 'shade-login',
  getInitialState: ({ injector }) => ({
    username: '',
    password: '',
    error: injector.getInstance(SessionService).loginError.getValue(),
    isOperationInProgress: injector.getInstance(SessionService).isOperationInProgress.getValue(),
  }),
  resources: ({ injector, updateState }) => {
    const sessionService = injector.getInstance(SessionService)
    return [
      sessionService.loginError.subscribe((error) => updateState({ error }), true),
      sessionService.isOperationInProgress.subscribe((isOperationInProgress) => {
        updateState({ isOperationInProgress })
      }),
    ]
  },

  render: ({ injector, getState, updateState }) => {
    const { error, username, password, isOperationInProgress } = getState()
    const sessinService = injector.getInstance(SessionService)

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 100px',
          paddingTop: '100px',
        }}>
        <form
          className="login-form"
          onsubmit={(ev) => {
            ev.preventDefault()
            const state = getState()
            sessinService.login(state.username, state.password)
          }}>
          <Paper elevation={3}>
            <h2>Login</h2>
            <Input
              labelTitle="User name"
              name="username"
              autofocus
              required
              disabled={isOperationInProgress}
              placeholder="The user's login name"
              value={username}
              onTextChange={(newUserName) => updateState({ username: newUserName }, true)}
              type="text"
            />
            <Input
              labelTitle="Password"
              name="password"
              required
              disabled={isOperationInProgress}
              placeholder="The password for the user"
              value={password}
              type="password"
              onTextChange={(newPassword) => updateState({ password: newPassword }, true)}
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
            </div>
            <p style={{ fontSize: '10px' }}>You can login with the default 'testuser' / 'password' credentials</p>
          </Paper>
        </form>
      </div>
    )
  },
})
