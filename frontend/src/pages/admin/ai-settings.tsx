import { createComponent, Shade } from '@furystack/shades'
import { Button, Form, Input, NotyService, Paper } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { OllamaConfig } from 'common'
import { ConfigService } from '../../services/config-service.js'

type OllamaFormData = OllamaConfig['value']

const isValidUrl = (urlString: string): boolean => {
  if (urlString === '') return true
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const AiSettingsPage = Shade({
  shadowDomName: 'ai-settings-page',
  render: ({ injector, useObservable, useDisposable }) => {
    const configService = injector.getInstance(ConfigService)
    const notyService = injector.getInstance(NotyService)

    const [config] = useObservable('ollamaConfig', configService.getConfigAsObservable('OLLAMA_CONFIG'))

    const isLoadingObservable = useDisposable('isLoading', () => new ObservableValue(false))
    const [isLoading] = useObservable('isLoadingValue', isLoadingObservable)

    const validationErrorObservable = useDisposable('validationError', () => new ObservableValue<string | null>(null))
    const [validationError] = useObservable('validationErrorValue', validationErrorObservable)

    const validateForm = (formData: Record<string, unknown>): string | null => {
      const host = (formData.host as string) ?? ''

      if (host !== '' && !isValidUrl(host)) {
        return 'Please enter a valid URL (e.g., http://localhost:11434)'
      }
      return null
    }

    const handleSubmit = async (formData: Record<string, unknown>) => {
      const error = validateForm(formData)
      if (error) {
        validationErrorObservable.setValue(error)
        return
      }
      validationErrorObservable.setValue(null)

      const data: OllamaFormData = {
        host: (formData.host as string) ?? '',
      }

      isLoadingObservable.setValue(true)
      try {
        await configService.saveConfig('OLLAMA_CONFIG', data)
        notyService.emit('onNotyAdded', {
          title: 'Success',
          body: 'AI settings saved successfully',
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

    if (config.status === 'loading' || config.status === 'uninitialized') {
      return (
        <div>
          <h2 style={{ marginBottom: '24px', color: 'var(--theme-text-primary)' }}>🤖 Ollama Integration</h2>
          <Paper elevation={1} style={{ padding: '24px' }}>
            <p style={{ color: 'var(--theme-text-secondary)' }}>Loading settings...</p>
          </Paper>
        </div>
      )
    }

    const currentValues: OllamaFormData =
      config.status === 'loaded' && config.value
        ? (config.value.value as OllamaFormData)
        : {
            host: '',
          }

    return (
      <div>
        <h2 style={{ marginBottom: '24px', color: 'var(--theme-text-primary)' }}>🤖 Ollama Integration</h2>
        <p style={{ marginBottom: '24px', color: 'var(--theme-text-secondary)' }}>
          Configure the connection to your Ollama server for AI-powered features.
        </p>

        <Paper elevation={1} style={{ padding: '24px' }}>
          <Form<Record<string, unknown>>
            validate={(data): data is Record<string, unknown> => {
              const error = validateForm(data as Record<string, unknown>)
              validationErrorObservable.setValue(error)
              return error === null
            }}
            onSubmit={(data) => void handleSubmit(data)}
          >
            <div style={{ marginBottom: '24px' }}>
              <Input
                labelTitle="Ollama Host URL"
                name="host"
                type="url"
                value={currentValues.host}
                placeholder="http://localhost:11434"
                style={{ maxWidth: '400px' }}
              />
              <small style={{ color: 'var(--theme-text-secondary)', display: 'block', marginTop: '4px' }}>
                The Ollama server URL including protocol (http or https). Leave empty to disable AI features.
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
      </div>
    )
  },
})
