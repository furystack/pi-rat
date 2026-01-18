import { createComponent, Shade } from '@furystack/shades'
import { Button, Form, Input, NotyService, Paper } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { OllamaConfig } from 'common'
import { ConfigService } from '../../services/config-service.js'

type OllamaFormData = OllamaConfig['value']

export const AiSettingsPage = Shade({
  shadowDomName: 'ai-settings-page',
  render: ({ injector, useObservable, useDisposable }) => {
    const configService = injector.getInstance(ConfigService)
    const notyService = injector.getInstance(NotyService)

    const [config] = useObservable('ollamaConfig', configService.getConfigAsObservable('OLLAMA_CONFIG'))

    const isLoadingObservable = useDisposable('isLoading', () => new ObservableValue(false))
    const [isLoading] = useObservable('isLoadingValue', isLoadingObservable)

    const handleSubmit = async (formData: Record<string, unknown>) => {
      const data: OllamaFormData = {
        host: formData.host as string,
      }

      isLoadingObservable.setValue(true)
      try {
        await configService.saveConfig('OLLAMA_CONFIG', data)
        notyService.emit('onNotyAdded', {
          title: 'Success',
          body: 'AI settings saved successfully',
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
              const formData = data as Record<string, unknown>
              const host = formData.host as string
              return typeof host === 'string'
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
