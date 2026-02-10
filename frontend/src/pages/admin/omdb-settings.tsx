import { createComponent, Shade } from '@furystack/shades'
import { Button, Form, Input, NotyService, Paper } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { OmdbConfig } from 'common'
import { ConfigService } from '../../services/config-service.js'

type OmdbFormData = OmdbConfig['value']

export const OmdbSettingsPage = Shade({
  shadowDomName: 'omdb-settings-page',
  css: {
    '& .page-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      height: '100%',
    },
    '& .page-title': {
      marginBottom: '24px',
      color: 'var(--theme-text-primary)',
    },
    '& .page-description': {
      marginBottom: '24px',
      color: 'var(--theme-text-secondary)',
    },
    '& .loading-text': {
      color: 'var(--theme-text-secondary)',
    },
    '& .form-field': {
      marginBottom: '24px',
    },
    '& .api-key-row': {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '8px',
    },
    '& .api-key-hint': {
      color: 'var(--theme-text-secondary)',
      display: 'block',
      marginTop: '4px',
    },
    '& .api-key-hint a': {
      color: 'var(--theme-primary-main)',
    },
    '& .checkbox-label': {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer',
      color: 'var(--theme-text-primary)',
    },
    '& .checkbox-label input': {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
    },
    '& .checkbox-title': {
      fontWeight: '500',
    },
    '& .checkbox-description': {
      color: 'var(--theme-text-secondary)',
    },
    '& .form-footer': {
      borderTop: '1px solid var(--theme-background-default)',
      paddingTop: '16px',
    },
  },
  render: ({ injector, useObservable, useDisposable, useState }) => {
    const configService = injector.getInstance(ConfigService)
    const notyService = injector.getInstance(NotyService)

    const [config] = useObservable('omdbConfig', configService.getConfigAsObservable('OMDB_CONFIG'))

    const isLoadingObservable = useDisposable('isLoading', () => new ObservableValue(false))
    const [isLoading] = useObservable('isLoadingValue', isLoadingObservable)
    const [isApiKeyVisible, setApiKeyVisible] = useState('apiKeyVisible', false)

    const toggleApiKeyVisibility = () => {
      setApiKeyVisible(!isApiKeyVisible)
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
          <h2 className="page-title">🎬 OMDB Settings</h2>
          <Paper elevation={1} style={{ padding: '24px' }}>
            <p className="loading-text">Loading settings...</p>
          </Paper>
        </div>
      )
    }

    const currentValues: OmdbFormData =
      config.status === 'loaded' && config.value
        ? (config.value.value as OmdbFormData)
        : { apiKey: '', trySearchMovieFromTitle: true, autoDownloadMetadata: true }

    return (
      <div className="page-container">
        <h2 className="page-title">🎬 OMDB Settings</h2>
        <p className="page-description">Configure the OMDB API integration for fetching movie and series metadata.</p>

        <Paper elevation={1} style={{ padding: '24px' }}>
          <Form<Record<string, unknown>>
            validate={(data): data is Record<string, unknown> => {
              return typeof (data as Record<string, unknown>).apiKey === 'string'
            }}
            onSubmit={(data) => void handleSubmit(data)}
          >
            <div className="form-field">
              <div className="api-key-row">
                <Input
                  labelTitle="API Key"
                  name="apiKey"
                  type={isApiKeyVisible ? 'text' : 'password'}
                  value={currentValues.apiKey}
                  placeholder="Enter your OMDB API key"
                  style={{ flex: '1' }}
                />
                <Button
                  type="button"
                  variant="outlined"
                  onclick={toggleApiKeyVisibility}
                  style={{ marginBottom: '4px' }}
                >
                  {isApiKeyVisible ? '🙈 Hide' : '👁️ Show'}
                </Button>
              </div>
              <small className="api-key-hint">
                Get your API key at{' '}
                <a href="https://www.omdbapi.com/apikey.aspx" target="_blank" rel="noopener noreferrer">
                  omdbapi.com
                </a>
              </small>
            </div>

            <div className="form-field">
              <label className="checkbox-label">
                <input type="checkbox" name="trySearchMovieFromTitle" checked={currentValues.trySearchMovieFromTitle} />
                <div>
                  <div className="checkbox-title">Auto-search from filename</div>
                  <small className="checkbox-description">
                    When a movie or series is added, automatically search for metadata based on the filename
                  </small>
                </div>
              </label>
            </div>

            <div className="form-field">
              <label className="checkbox-label">
                <input type="checkbox" name="autoDownloadMetadata" checked={currentValues.autoDownloadMetadata} />
                <div>
                  <div className="checkbox-title">Auto-download metadata</div>
                  <small className="checkbox-description">
                    Automatically download metadata when a new IMDB ID is added
                  </small>
                </div>
              </label>
            </div>

            <div className="form-footer">
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
