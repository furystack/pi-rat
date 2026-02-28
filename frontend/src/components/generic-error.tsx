import { ResponseError } from '@furystack/rest-client-fetch'
import { createComponent, ScreenService, Shade } from '@furystack/shades'
import { Button, ThemeProviderService } from '@furystack/shades-common-components'
import deadSmiley from '../animations/error-dead-smiley.json' with { type: 'json' }
import redCross from '../animations/error-red-cross.json' with { type: 'json' }
import { ErrorReporter } from '../services/error-reporter.js'
import { Error404 } from './error-404.js'
import { ErrorDisplay } from './error-display.js'

export type GenericErrorProps = {
  mainTitle?: string
  subtitle?: string
  description?: JSX.Element
  error?: unknown
  retry?: () => Promise<void>
}

export const GenericErrorPage = Shade<GenericErrorProps>({
  shadowDomName: 'multiverse-generic-error-page',
  css: {
    '& .error-container': {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      alignItems: 'center',
      padding: '0 100px',
      paddingTop: '4em',
    },
    '& .error-container.desktop': {
      justifyContent: 'center',
    },
    '& .error-container.mobile': {
      justifyContent: 'flex-start',
    },
    '& .error-content': {
      display: 'flex',
      flexDirection: 'column',
      perspective: '400px',
      animation: 'shake 150ms 2 linear',
    },
    '& .error-main': {
      display: 'flex',
      flexWrap: 'wrap',
    },
    '& .error-message': {
      maxWidth: '750px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    },
    '& .error-message h1': {
      marginTop: '0',
      whiteSpace: 'nowrap',
    },
    '& .error-actions': {
      display: 'flex',
      marginTop: '2em',
      width: '70%',
      justifyContent: 'space-evenly',
      whiteSpace: 'nowrap',
    },
  },
  render: ({ props, injector }) => {
    if (props.error && props.error instanceof ResponseError && props.error.response.status === 404) {
      return <Error404 />
    }

    const isDesktop = injector.getInstance(ScreenService).screenSize.atLeast.md.getValue()
    const { theme } = injector.getInstance(ThemeProviderService)
    return (
      <div className={`error-container ${isDesktop ? 'desktop' : 'mobile'}`} style={{ color: theme.text.secondary }}>
        <div className="error-content">
          <div className="error-main">
            <lottie-player
              autoplay
              style={{ width: '250px', height: '250px' }}
              mode="bounce"
              src={Math.random() > 0.5 ? JSON.stringify(redCross) : JSON.stringify(deadSmiley)}
            ></lottie-player>
            <div className="error-message">
              <h1> {props.mainTitle || 'WhoOoOops... 😱'}</h1>
              <h3> {props.subtitle || 'Something terrible happened 😓'}</h3>

              {props.description || <ErrorDisplay error={props.error} />}
            </div>
          </div>
        </div>
        <div className="error-actions">
          <a href="/">
            <Button>🏡 Go Home</Button>
          </a>
          {props.retry ? <Button onclick={() => props.retry?.()}>🔄️ Retry</Button> : null}
          {props.error ? (
            <Button onclick={() => injector.getInstance(ErrorReporter).sendErrorReport(props.error as Error)}>
              📩 Report error
            </Button>
          ) : null}
        </div>
      </div>
    )
  },
})
