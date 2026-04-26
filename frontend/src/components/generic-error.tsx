import { ResponseError } from '@furystack/rest-client-fetch'
import { createComponent, NestedRouteLink, Shade } from '@furystack/shades'
import {
  Button,
  Icon,
  icons,
  Result,
  resultDefaultTitles,
  type ResultStatus,
} from '@furystack/shades-common-components'
import { ErrorReporter } from '../services/error-reporter.js'

export type GenericErrorProps = {
  error?: unknown
  retry?: () => Promise<void>
}

const deriveStatus = (error: unknown): ResultStatus => {
  if (error instanceof ResponseError) {
    const code = error.response.status
    if (code === 404) return '404'
    if (code === 403) return '403'
    if (code >= 500) return '500'
  }
  return 'error'
}

const deriveDescription = (error: unknown): string => {
  if (error instanceof ResponseError && error.response.statusText) {
    return error.response.statusText
  }
  if (error instanceof Error) {
    switch (error.message) {
      case '404':
        return 'The content you are looking for does not exist.'
      case '403':
        return 'You are not authorized to access this content.'
      case '500':
        return 'An error occurred while loading the content. Please try again later.'
      case 'Network Error':
        return 'Unable to connect to the server. Please check your internet connection.'
      case 'Timeout':
        return 'The request timed out. Please try again later.'
      case 'AbortError':
        return 'The request was aborted. Please try again later.'
      case 'Invalid JSON':
        return 'The server returned invalid JSON. Please try again later.'
      case 'Invalid URL':
        return 'The server returned an invalid URL. Please try again later.'
      case 'Failed to fetch':
        return 'Failed to fetch the content. Please try again later.'
      default:
        return error.message
    }
  }
  return 'An error occurred while loading the content. Please try again later.'
}

export const GenericErrorPage = Shade<GenericErrorProps>({
  customElementName: 'multiverse-generic-error-page',
  render: ({ props, injector }) => {
    const status = deriveStatus(props.error)
    const mainTitle = resultDefaultTitles[status]
    const description = deriveDescription(props.error)

    return (
      <Result status={status} title={mainTitle} subtitle={description}>
        <NestedRouteLink path="/">
          <Button>
            <Icon icon={icons.home} size="small" /> Go Home
          </Button>
        </NestedRouteLink>
        {props.retry ? (
          <Button onclick={() => props.retry?.()}>
            <Icon icon={icons.refresh} size="small" /> Retry
          </Button>
        ) : null}
        {props.error ? (
          <Button onclick={() => injector.get(ErrorReporter).sendErrorReport(props.error as Error)}>
            <Icon icon={icons.send} size="small" /> Report error
          </Button>
        ) : null}
      </Result>
    )
  },
})
