import type { CacheWithValue } from '@furystack/cache'
import { createComponent, Shade } from '@furystack/shades'
import { Button, CacheView, Form, Input, NotyService, Paper, Skeleton } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { Config, OllamaConfig } from 'common'
import { GenericErrorPage } from '../../components/generic-error.js'
import { ConfigService } from '../../services/config-service.js'

type OllamaFormData = OllamaConfig['value']

export type OllamaRawFormData = {
  host: string
}

export const isValidUrl = (urlString: string): boolean => {
  if (urlString === '') return true
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const isOllamaRawFormData = (data: unknown): data is OllamaRawFormData => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  if (typeof d.host !== 'string') return false
  return isValidUrl(d.host)
}

const AiSettingsContent = Shade<{ data: CacheWithValue<Config> }>({
  shadowDomName: 'ai-settings-content',
  css: {
    '& .page-description': {
      marginBottom: '24px',
      color: 'var(--theme-text-secondary)',
    },
    '& .form-field': {
      marginBottom: '24px',
    },
    '& .field-hint': {
      color: 'var(--theme-text-secondary)',
      display: 'block',
      marginTop: '4px',
    },
    '& .validation-error': {
      color: 'var(--theme-error-main)',
      backgroundColor: 'var(--theme-error-light)',
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '16px',
    },
    '& .form-footer': {
      borderTop: '1px solid var(--theme-background-default)',
      paddingTop: '16px',
    },
  },
  render: ({ props, injector, useObservable, useDisposable }) => {
    const configService = injector.getInstance(ConfigService)
    const notyService = injector.getInstance(NotyService)

    const isLoadingObservable = useDisposable('isLoading', () => new ObservableValue(false))
    const [isLoading] = useObservable('isLoadingValue', isLoadingObservable)

    const validationErrorObservable = useDisposable('validationError', () => new ObservableValue<string | null>(null))
    const [validationError] = useObservable('validationErrorValue', validationErrorObservable)

    const handleSubmit = async (formData: OllamaRawFormData) => {
      validationErrorObservable.setValue(null)

      const data: OllamaFormData = {
        host: formData.host,
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

    const currentValues: OllamaFormData = props.data.value.value
      ? (props.data.value.value as OllamaFormData)
      : { host: '' }

    return (
      <>
        <p className="page-description">Configure the connection to your Ollama server for AI-powered features.</p>

        <Paper elevation={1} style={{ padding: '24px' }}>
          <Form<OllamaRawFormData>
            validate={(data): data is OllamaRawFormData => {
              const isValid = isOllamaRawFormData(data)
              if (!isValid) {
                validationErrorObservable.setValue('Please enter a valid URL (e.g., http://localhost:11434)')
              }
              return isValid
            }}
            onSubmit={(data) => void handleSubmit(data)}
          >
            <div className="form-field">
              <Input
                labelTitle="Ollama Host URL"
                name="host"
                type="url"
                value={currentValues.host}
                placeholder="http://localhost:11434"
                style={{ maxWidth: '400px' }}
              />
              <small className="field-hint">
                The Ollama server URL including protocol (http or https). Leave empty to disable AI features.
              </small>
            </div>

            {validationError && (
              <div className="validation-error" data-testid="validation-error">
                {validationError}
              </div>
            )}

            <div className="form-footer">
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

export const AiSettingsPage = Shade({
  shadowDomName: 'ai-settings-page',
  css: {
    '& .page-title': {
      marginBottom: '24px',
      color: 'var(--theme-text-primary)',
    },
  },
  render: ({ injector }) => {
    const configService = injector.getInstance(ConfigService)

    return (
      <div>
        <h2 className="page-title">🤖 Ollama Integration</h2>
        <CacheView
          cache={configService.configCache}
          args={['OLLAMA_CONFIG']}
          content={AiSettingsContent}
          loader={<Skeleton />}
          error={(err, retry) => <GenericErrorPage error={err} retry={async () => retry()} />}
        />
      </div>
    )
  },
})
