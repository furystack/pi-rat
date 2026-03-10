import { Shade, createComponent } from '@furystack/shades'
import { Result } from '@furystack/shades-common-components'
import { environmentOptions } from '../utils/environment-options.js'

export const Offline = Shade({
  customElementName: 'shade-offline',
  css: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  render: () => {
    return (
      <Result
        status="error"
        title="Service Offline"
        subtitle={`There was a trouble connecting to the backend service at ${environmentOptions.serviceUrl}. It seems the service is inaccessible at the moment.`}
      >
        <div style={{ textAlign: 'left' }}>
          <ul>
            <li>
              The URL above is correct. You can set it in your 'SERVICE_URL' environment variable before building the
              app.
            </li>
            <li>
              CORS is enabled in the service from <a href={window.location.origin}>{window.location.origin}</a>
            </li>
            <li>You have started the service :)</li>
          </ul>
          {/* eslint-disable-next-line furystack/prefer-nested-route-link -- Intentional full page reload to re-check service connectivity */}
          <a href="/">Reload page</a>
        </div>
      </Result>
    )
  },
})
