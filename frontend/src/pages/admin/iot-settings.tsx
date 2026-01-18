import { createComponent, Shade } from '@furystack/shades'
import { Button, Form, Input, NotyService, Paper } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { IotConfig } from 'common'
import { ConfigService } from '../../services/config-service.js'

type IotFormData = IotConfig['value']

export const IotSettingsPage = Shade({
  shadowDomName: 'iot-settings-page',
  render: ({ injector, useObservable, useDisposable }) => {
    const configService = injector.getInstance(ConfigService)
    const notyService = injector.getInstance(NotyService)

    const [config] = useObservable('iotConfig', configService.getConfigAsObservable('IOT_CONFIG'))

    const isLoadingObservable = useDisposable('isLoading', () => new ObservableValue(false))
    const [isLoading] = useObservable('isLoadingValue', isLoadingObservable)

    const handleSubmit = async (formData: Record<string, unknown>) => {
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
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save settings'
        notyService.emit('onNotyAdded', {
          title: 'Error',
          body: errorMessage,
          type: 'error',
        })
      } finally {
        isLoadingObservable.setValue(false)
      }
    }

    if (config.status === 'loading' || config.status === 'uninitialized') {
      return (
        <div>
          <h2 style={{ marginBottom: '24px', color: 'var(--theme-text-primary)' }}>📡 IOT Device Availability</h2>
          <Paper elevation={1} style={{ padding: '24px' }}>
            <p style={{ color: 'var(--theme-text-secondary)' }}>Loading settings...</p>
          </Paper>
        </div>
      )
    }

    const currentValues: IotFormData =
      config.status === 'loaded' && config.value
        ? (config.value.value as IotFormData)
        : {
            pingIntervalMs: 30000,
            pingTimeoutMs: 3000,
          }

    return (
      <div>
        <h2 style={{ marginBottom: '24px', color: 'var(--theme-text-primary)' }}>📡 IOT Device Availability</h2>
        <p style={{ marginBottom: '24px', color: 'var(--theme-text-secondary)' }}>
          Configure how frequently IOT devices are pinged to check their availability.
        </p>

        <Paper elevation={1} style={{ padding: '24px' }}>
          <Form<Record<string, unknown>>
            validate={(data): data is Record<string, unknown> => {
              const formData = data as Record<string, unknown>
              const pingIntervalMs = Number(formData.pingIntervalMs)
              const pingTimeoutMs = Number(formData.pingTimeoutMs)
              return (
                !isNaN(pingIntervalMs) &&
                pingIntervalMs >= 1000 &&
                !isNaN(pingTimeoutMs) &&
                pingTimeoutMs >= 100 &&
                pingTimeoutMs < pingIntervalMs
              )
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
                min="1000"
                required
                style={{ maxWidth: '250px' }}
              />
              <small style={{ color: 'var(--theme-text-secondary)', display: 'block', marginTop: '4px' }}>
                How often to ping all IOT devices (minimum 1000ms). Default: 30000ms (30 seconds).
              </small>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <Input
                labelTitle="Ping Timeout (ms)"
                name="pingTimeoutMs"
                type="number"
                value={currentValues.pingTimeoutMs.toString()}
                placeholder="Enter ping timeout in milliseconds"
                min="100"
                required
                style={{ maxWidth: '250px' }}
              />
              <small style={{ color: 'var(--theme-text-secondary)', display: 'block', marginTop: '4px' }}>
                Timeout for each ping request (must be less than ping interval). Default: 3000ms (3 seconds).
              </small>
            </div>

            <div style={{ borderTop: '1px solid var(--theme-background-default)', paddingTop: '16px' }}>
              <Button type="submit" variant="contained" color="primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </Form>
        </Paper>
      </div>
    )
  },
})
