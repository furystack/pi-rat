import { Shade, createComponent, ScreenService } from '@furystack/shades'
import { Button, ThemeProviderService } from '@furystack/shades-common-components'

import redCross from '../animations/error-red-cross.json'
import deadSmiley from '../animations/error-dead-smiley.json'
import { ErrorReporter } from '../services/error-reporter'
import { getErrorMessage } from '../services/get-error-message'

export interface GenericErrorProps {
  mainTitle?: string
  subtitle?: string
  description?: JSX.Element
  error?: any
  retry?: () => void
}

export const GenericErrorPage = Shade<GenericErrorProps>({
  shadowDomName: 'multiverse-generic-error-page',
  render: ({ props, injector }) => {
    const isDesktop = injector.getInstance(ScreenService).screenSize.atLeast.md.getValue()
    const { theme } = injector.getInstance(ThemeProviderService)
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          alignItems: 'center',
          justifyContent: isDesktop ? 'center' : 'flex-start',
          padding: '0 100px',
          color: theme.text.secondary,
          paddingTop: '4em',
        }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            perspective: '400px',
            animation: 'shake 150ms 2 linear',
          }}>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            <lottie-player
              autoplay
              style={{ width: '250px', height: '250px' }}
              mode="bounce"
              src={Math.random() > 0.5 ? JSON.stringify(redCross) : JSON.stringify(deadSmiley)}></lottie-player>
            <div
              style={{
                maxWidth: '750px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'var(--error-color)',
              }}>
              <h1 style={{ marginTop: '0', whiteSpace: 'nowrap' }}> {props.mainTitle || 'WhoOoOops... 😱'}</h1>
              <h3> {props.subtitle || 'Something terrible happened 😓'}</h3>

              {props.description ||
                (props.error && getErrorMessage(props.error)) ||
                "And you know what's worse? No further details are available... 😿"}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: '2em',
            width: '70%',
            justifyContent: 'space-evenly',
            whiteSpace: 'nowrap',
          }}>
          <a href="/">
            <Button>🏡 Go Home</Button>
          </a>
          {props.retry ? <Button onclick={() => props.retry?.()}>🔄️ Retry</Button> : null}
          {props.error ? (
            <Button onclick={() => injector.getInstance(ErrorReporter).sendErrorReport(props.error)}>
              📩 Report error
            </Button>
          ) : null}
        </div>
      </div>
    )
  },
})
