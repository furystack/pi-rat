import { Shade, createComponent } from '@furystack/shades'
import { environmentOptions } from '../environment-options.js'

export const Offline = Shade({
  shadowDomName: 'shade-offline',
  render: () => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 100px',
        }}
      >
        <div
          id="offline"
          style={{
            display: 'flex',
            flexDirection: 'column',
            perspective: '400px',
          }}
        >
          <h1>WhoOoOops... 😱</h1>
          <h3>The service seems to be offline 😓</h3>
          <p>
            There was a trouble connecting to the backend service at{' '}
            <a href={environmentOptions.serviceUrl} target="_blank">
              {environmentOptions.serviceUrl}
            </a>
            . It seems to be the service is unaccessible at the moment. You can check the following things:
          </p>
          <ul>
            <li>
              The URL above is correct. You can set in in your 'SERVICE_URL' environment variable before building the
              app.
            </li>
            <li>
              CORS is enabled in the service from <a href={window.location.origin}>{window.location.origin}</a>
            </li>
            <li>You have started the service :)</li>
          </ul>
        </div>
        <a href="/">Reload page</a>
      </div>
    )
  },
})
