import type { CacheWithValue } from '@furystack/cache'
import { createComponent, Shade } from '@furystack/shades'
import { Button, CacheView, Form, Input, NotyService, Paper, Skeleton } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { Config, IotConfig } from 'common'
import { GenericErrorPage } from '../../components/generic-error.js'
import { ConfigService } from '../../services/config-service.js'

type IotFormData = IotConfig['value']

export const MIN_PING_INTERVAL_MS = 1000
export const MAX_PING_INTERVAL_MS = 3600000
export const MIN_PING_TIMEOUT_MS = 100
export const MAX_PING_TIMEOUT_MS = 60000
const DEFAULT_PING_INTERVAL_MS = 30000
const DEFAULT_PING_TIMEOUT_MS = 3000

export type IotRawFormData = {
  pingIntervalMs: string
  pingTimeoutMs: string
}

export const validateIotForm = (data: Record<string, unknown>): string | null => {
  const pingIntervalMs = Number(data.pingIntervalMs)
  const pingTimeoutMs = Number(data.pingTimeoutMs)

  if (isNaN(pingIntervalMs) || pingIntervalMs < MIN_PING_INTERVAL_MS) {
    return `Ping interval must be at least ${MIN_PING_INTERVAL_MS}ms`
  }
  if (pingIntervalMs > MAX_PING_INTERVAL_MS) {
    return `Ping interval must be at most ${MAX_PING_INTERVAL_MS}ms (1 hour)`
  }
  if (isNaN(pingTimeoutMs) || pingTimeoutMs < MIN_PING_TIMEOUT_MS) {
    return `Ping timeout must be at least ${MIN_PING_TIMEOUT_MS}ms`
  }
  if (pingTimeoutMs > MAX_PING_TIMEOUT_MS) {
    return `Ping timeout must be at most ${MAX_PING_TIMEOUT_MS}ms (1 minute)`
  }
  if (pingTimeoutMs >= pingIntervalMs) {
    return 'Ping timeout must be less than ping interval'
  }
  return null
}

export const isIotRawFormData = (data: unknown): data is IotRawFormData => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  if (typeof d.pingIntervalMs !== 'string' || typeof d.pingTimeoutMs !== 'string') return false
  return validateIotForm(d) === null
}

const IotSettingsContent = Shade<{ data: CacheWithValue<Config> }>({
  shadowDomName: 'iot-settings-content',
  render: ({ props, injector, useObservable, useDisposable }) => {
    const configService = injector.getInstance(ConfigService)
    const notyService = injector.getInstance(NotyService)

    const isLoadingObservable = useDisposable('isLoading', () => new ObservableValue(false))
    const [isLoading] = useObservable('isLoadingValue', isLoadingObservable)

    const validationErrorObservable = useDisposable('validationError', () => new ObservableValue<string | null>(null))
    const [validationError] = useObservable('validationErrorValue', validationErrorObservable)

    const handleSubmit = async (formData: IotRawFormData) => {
      validationErrorObservable.setValue(null)

      const data: IotFormData = {
        pingIntervalMs: Number(formData.pingIntervalMs),
        pingTimeoutMs: Number(formData.pingTimeoutMs),
      }

      isLoadingObservable.setValue(true)
      try {
        await configService.saveConfig('IOT_CONFIG', data)
        notyService.emit('onNotyAdded', {
          title: 'Success',
          body: 'IOT settings saved successfully',
          type: 'success',
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save settings'
        notyService.emit('onNotyAdded', {
          title: 'Error',
          body: errorMessage,
          type: 'error',
        })
      } finally {
        isLoadingObservable.setValue(false)
      }
    }

    const currentValues: IotFormData = props.data.value.value
      ? (props.data.value.value as IotFormData)
      : {
          pingIntervalMs: DEFAULT_PING_INTERVAL_MS,
          pingTimeoutMs: DEFAULT_PING_TIMEOUT_MS,
        }

    return (
      <>
        <p style={{ marginBottom: '24px', color: 'var(--theme-text-secondary)' }}>
          Configure how frequently IOT devices are pinged to check their availability.
        </p>

        <Paper elevation={1} style={{ padding: '24px' }}>
          <Form<IotRawFormData>
            validate={(data): data is IotRawFormData => {
              const isValid = isIotRawFormData(data)
              validationErrorObservable.setValue(
                isValid || typeof data !== 'object' || data === null
                  ? null
                  : validateIotForm(data as Record<string, unknown>),
              )
              return isValid
            }}
            onSubmit={(data) => void handleSubmit(data)}
          >
            <div style={{ marginBottom: '24px' }}>
              <Input
                labelTitle="Ping Interval (ms)"
                name="pingIntervalMs"
                type="number"
                value={currentValues.pingIntervalMs.toString()}
                placeholder="Enter ping interval in milliseconds"
                min={MIN_PING_INTERVAL_MS.toString()}
                max={MAX_PING_INTERVAL_MS.toString()}
                required
                style={{ maxWidth: '250px' }}
              />
              <small style={{ color: 'var(--theme-text-secondary)', display: 'block', marginTop: '4px' }}>
                How often to ping all IOT devices ({MIN_PING_INTERVAL_MS}ms - {MAX_PING_INTERVAL_MS}ms). Default:{' '}
                {DEFAULT_PING_INTERVAL_MS}ms ({DEFAULT_PING_INTERVAL_MS / 1000} seconds).
              </small>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <Input
                labelTitle="Ping Timeout (ms)"
                name="pingTimeoutMs"
                type="number"
                value={currentValues.pingTimeoutMs.toString()}
                placeholder="Enter ping timeout in milliseconds"
                min={MIN_PING_TIMEOUT_MS.toString()}
                max={MAX_PING_TIMEOUT_MS.toString()}
                required
                style={{ maxWidth: '250px' }}
              />
              <small style={{ color: 'var(--theme-text-secondary)', display: 'block', marginTop: '4px' }}>
                Timeout for each ping request ({MIN_PING_TIMEOUT_MS}ms - {MAX_PING_TIMEOUT_MS}ms, must be less than
                interval). Default: {DEFAULT_PING_TIMEOUT_MS}ms ({DEFAULT_PING_TIMEOUT_MS / 1000} seconds).
              </small>
            </div>

            {validationError && (
              <div
                style={{
                  color: 'var(--theme-error-main)',
                  backgroundColor: 'var(--theme-error-light)',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '16px',
                }}
                data-testid="validation-error"
              >
                {validationError}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--theme-background-default)', paddingTop: '16px' }}>
              <Button type="submit" variant="contained" color="primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </Form>
        </Paper>
      </>
    )
  },
})

export const IotSettingsPage = Shade({
  shadowDomName: 'iot-settings-page',
  render: ({ injector }) => {
    const configService = injector.getInstance(ConfigService)

    return (
      <div>
        <h2 style={{ marginBottom: '24px', color: 'var(--theme-text-primary)' }}>📡 IOT Device Availability</h2>
        <CacheView
          cache={configService.configCache}
          args={['IOT_CONFIG']}
          content={IotSettingsContent}
          loader={<Skeleton />}
          error={(err, retry) => <GenericErrorPage error={err} retry={async () => retry()} />}
        />
      </div>
    )
  },
})
