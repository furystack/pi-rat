import { createComponent, Shade } from '@furystack/shades'
import { Button, Form, Input, NotyService, Paper } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { OmdbConfig } from 'common'
import { ConfigService } from '../../services/config-service.js'

type OmdbFormData = OmdbConfig['value']

export const OmdbSettingsPage = Shade({
  shadowDomName: 'omdb-settings-page',
  render: ({ injector, useObservable, useDisposable, element }) => {
    const configService = injector.getInstance(ConfigService)
    const notyService = injector.getInstance(NotyService)

    const [config] = useObservable('omdbConfig', configService.getConfigAsObservable('OMDB_CONFIG'))

    const isLoadingObservable = useDisposable('isLoading', () => new ObservableValue(false))
    const [isLoading] = useObservable('isLoadingValue', isLoadingObservable)

    const toggleApiKeyVisibility = () => {
      const input = element.querySelector<HTMLInputElement>('input[name="apiKey"]')
      const button = element.querySelector<HTMLButtonElement>('[data-toggle-visibility]')
      if (input && button) {
        const isPassword = input.type === 'password'
        input.type = isPassword ? 'text' : 'password'
        button.textContent = isPassword ? '🙈 Hide' : '👁️ Show'
      }
    }

    const handleSubmit = async (formData: Record<string, unknown>) => {
      const data: OmdbFormData = {
        apiKey: formData.apiKey as string,
        trySearchMovieFromTitle: formData.trySearchMovieFromTitle === 'on',
        autoDownloadMetadata: formData.autoDownloadMetadata === 'on',
      }

      isLoadingObservable.setValue(true)
      try {
        await configService.saveConfig('OMDB_CONFIG', data)
        notyService.emit('onNotyAdded', {
          title: 'Success',
          body: 'OMDB settings saved successfully',
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
          <h2 style={{ marginBottom: '24px', color: 'var(--theme-text-primary)' }}>🎬 OMDB Settings</h2>
          <Paper elevation={1} style={{ padding: '24px' }}>
            <p style={{ color: 'var(--theme-text-secondary)' }}>Loading settings...</p>
          </Paper>
        </div>
      )
    }

    const currentValues: OmdbFormData =
      config.status === 'loaded' && config.value
        ? (config.value.value as OmdbFormData)
        : { apiKey: '', trySearchMovieFromTitle: true, autoDownloadMetadata: true }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
        <h2 style={{ marginBottom: '24px', color: 'var(--theme-text-primary)' }}>🎬 OMDB Settings</h2>
        <p style={{ marginBottom: '24px', color: 'var(--theme-text-secondary)' }}>
          Configure the OMDB API integration for fetching movie and series metadata.
        </p>

        <Paper elevation={1} style={{ padding: '24px' }}>
          <Form<Record<string, unknown>>
            validate={(data): data is Record<string, unknown> => {
              return typeof (data as Record<string, unknown>).apiKey === 'string'
            }}
            onSubmit={(data) => void handleSubmit(data)}
          >
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <Input
                  labelTitle="API Key"
                  name="apiKey"
                  type="password"
                  value={currentValues.apiKey}
                  placeholder="Enter your OMDB API key"
                  style={{ flex: '1' }}
                />
                <Button
                  type="button"
                  variant="outlined"
                  onclick={toggleApiKeyVisibility}
                  style={{ marginBottom: '4px' }}
                  data-toggle-visibility
                >
                  👁️ Show
                </Button>
              </div>
              <small style={{ color: 'var(--theme-text-secondary)', display: 'block', marginTop: '4px' }}>
                Get your API key at{' '}
                <a
                  href="https://www.omdbapi.com/apikey.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--theme-primary-main)' }}
                >
                  omdbapi.com
                </a>
              </small>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  color: 'var(--theme-text-primary)',
                }}
              >
                <input
                  type="checkbox"
                  name="trySearchMovieFromTitle"
                  checked={currentValues.trySearchMovieFromTitle}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: '500' }}>Auto-search from filename</div>
                  <small style={{ color: 'var(--theme-text-secondary)' }}>
                    When a movie or series is added, automatically search for metadata based on the filename
                  </small>
                </div>
              </label>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  color: 'var(--theme-text-primary)',
                }}
              >
                <input
                  type="checkbox"
                  name="autoDownloadMetadata"
                  checked={currentValues.autoDownloadMetadata}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: '500' }}>Auto-download metadata</div>
                  <small style={{ color: 'var(--theme-text-secondary)' }}>
                    Automatically download metadata when a new IMDB ID is added
                  </small>
                </div>
              </label>
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
