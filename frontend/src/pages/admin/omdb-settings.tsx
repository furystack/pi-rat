import type { CacheWithValue } from '@furystack/cache'
import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  CacheView,
  cssVariableTheme,
  Form,
  Icon,
  icons,
  Input,
  NotyService,
  PageContainer,
  PageHeader,
  Paper,
  Skeleton,
  Switch,
  Typography,
} from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { Config, OmdbConfig } from 'common'
import { GenericErrorPage } from '../../components/generic-error.js'
import { ConfigService } from '../../services/config-service.js'

type OmdbFormData = OmdbConfig['value']

export type OmdbRawFormData = {
  apiKey: string
  trySearchMovieFromTitle?: string
  autoDownloadMetadata?: string
}

export const isOmdbRawFormData = (data: unknown): data is OmdbRawFormData => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return typeof d.apiKey === 'string'
}

const OmdbSettingsContent = Shade<{ data: CacheWithValue<Config> }>({
  customElementName: 'omdb-settings-content',
  css: {
    '& .page-description': {
      marginBottom: '24px',
      color: cssVariableTheme.text.secondary,
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
      color: cssVariableTheme.text.secondary,
      display: 'block',
      marginTop: '4px',
    },
    '& .api-key-hint a': {
      color: cssVariableTheme.palette.primary.main,
    },
    '& .switch-description': {
      color: cssVariableTheme.text.secondary,
    },
    '& .form-footer': {
      borderTop: `1px solid ${cssVariableTheme.background.default}`,
      paddingTop: '16px',
    },
  },
  render: ({ props, injector, useObservable, useDisposable, useState }) => {
    const configService = injector.getInstance(ConfigService)
    const notyService = injector.getInstance(NotyService)

    const isLoadingObservable = useDisposable('isLoading', () => new ObservableValue(false))
    const [isLoading] = useObservable('isLoadingValue', isLoadingObservable)
    const [isApiKeyVisible, setApiKeyVisible] = useState('apiKeyVisible', false)

    const toggleApiKeyVisibility = () => {
      setApiKeyVisible(!isApiKeyVisible)
    }

    const handleSubmit = async (formData: OmdbRawFormData) => {
      const data: OmdbFormData = {
        apiKey: formData.apiKey,
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

    const currentValues: OmdbFormData = props.data.value.value
      ? (props.data.value.value as OmdbFormData)
      : { apiKey: '', trySearchMovieFromTitle: true, autoDownloadMetadata: true }

    return (
      <>
        <Typography variant="body1" className="page-description">
          Configure the OMDB API integration for fetching movie and series metadata.
        </Typography>

        <Paper elevation={1} style={{ padding: '24px' }}>
          <Form<OmdbRawFormData> validate={isOmdbRawFormData} onSubmit={(data) => void handleSubmit(data)}>
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
                  {isApiKeyVisible ? (
                    <>
                      <Icon icon={icons.eyeOff} size="small" /> Hide
                    </>
                  ) : (
                    <>
                      <Icon icon={icons.eye} size="small" /> Show
                    </>
                  )}
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
              <Switch
                name="trySearchMovieFromTitle"
                checked={currentValues.trySearchMovieFromTitle}
                labelTitle={
                  <div>
                    <div>Auto-search from filename</div>
                    <small className="switch-description">
                      When a movie or series is added, automatically search for metadata based on the filename
                    </small>
                  </div>
                }
              />
            </div>

            <div className="form-field">
              <Switch
                name="autoDownloadMetadata"
                checked={currentValues.autoDownloadMetadata}
                labelTitle={
                  <div>
                    <div>Auto-download metadata</div>
                    <small className="switch-description">
                      Automatically download metadata when a new IMDB ID is added
                    </small>
                  </div>
                }
              />
            </div>

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

export const OmdbSettingsPage = Shade({
  customElementName: 'omdb-settings-page',
  render: ({ injector }) => {
    const configService = injector.getInstance(ConfigService)

    return (
      <PageContainer gap="24px">
        <PageHeader icon={<Icon icon={icons.film} />} title="OMDB Settings" />
        <CacheView
          cache={configService.configCache}
          args={['OMDB_CONFIG']}
          content={OmdbSettingsContent}
          loader={<Skeleton />}
          error={(err, retry) => <GenericErrorPage error={err} retry={async () => retry()} />}
        />
      </PageContainer>
    )
  },
})
