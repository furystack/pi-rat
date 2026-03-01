import { Shade, createComponent } from '@furystack/shades'
import { Typography } from '@furystack/shades-common-components'
import { environmentOptions } from '../environment-options.js'

export const Offline = Shade({
  shadowDomName: 'shade-offline',
  css: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 100px',
    '& #offline': {
      display: 'flex',
      flexDirection: 'column',
      perspective: '400px',
    },
  },
  render: () => {
    return (
      <>
        <div id="offline">
          <Typography variant="h1">WhoOoOops... 😱</Typography>
          <Typography variant="h3">The service seems to be offline 😓</Typography>
          <Typography variant="body1">
            There was a trouble connecting to the backend service at{' '}
            <a href={environmentOptions.serviceUrl} target="_blank">
              {environmentOptions.serviceUrl}
            </a>
            . It seems to be the service is unaccessible at the moment. You can check the following things:
          </Typography>
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
      </>
    )
  },
})
