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
  Typography,
} from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { Config, TmdbConfig } from 'common'
import { GenericErrorPage } from '../../components/generic-error.js'
import { ConfigService } from '../../services/config-service.js'

type TmdbFormData = TmdbConfig['value']

type TmdbRawFormData = {
  apiKey: string
  defaultLanguage: string
  additionalLanguages: string
}

export const isTmdbRawFormData = (data: unknown): data is TmdbRawFormData => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return typeof d.apiKey === 'string'
}

const TmdbSettingsContent = Shade<{ data: CacheWithValue<Config> }>({
  customElementName: 'tmdb-settings-content',
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
    '& .field-hint': {
      color: cssVariableTheme.text.secondary,
      display: 'block',
      marginTop: '4px',
    },
    '& .field-hint a': {
      color: cssVariableTheme.palette.primary.main,
    },
    '& .form-footer': {
      borderTop: `1px solid ${cssVariableTheme.background.default}`,
      paddingTop: '16px',
    },
  },
  render: ({ props, injector, useObservable, useDisposable, useState }) => {
    const configService = injector.get(ConfigService)
    const notyService = injector.get(NotyService)

    const isLoadingObservable = useDisposable('isLoading', () => new ObservableValue(false))
    const [isLoading] = useObservable('isLoadingValue', isLoadingObservable)
    const [isApiKeyVisible, setApiKeyVisible] = useState('apiKeyVisible', false)

    const toggleApiKeyVisibility = () => {
      setApiKeyVisible(!isApiKeyVisible)
    }

    const handleSubmit = async (formData: TmdbRawFormData) => {
      const additionalLanguages = formData.additionalLanguages
        .split(',')
        .map((lang) => lang.trim())
        .filter(Boolean)

      const data: TmdbFormData = {
        apiKey: formData.apiKey,
        defaultLanguage: formData.defaultLanguage || 'en-US',
        additionalLanguages,
      }

      isLoadingObservable.setValue(true)
      try {
        await configService.saveConfig('TMDB_CONFIG', data)
        notyService.emit('onNotyAdded', {
          title: 'Success',
          body: 'TMDB settings saved successfully',
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

    const currentValues: TmdbFormData = props.data.value.value
      ? (props.data.value.value as TmdbFormData)
      : { apiKey: '', defaultLanguage: 'en-US', additionalLanguages: [] }

    return (
      <>
        <Typography variant="body1" className="page-description">
          Configure the TMDB API integration for fetching movie and series metadata with multi-language support.
        </Typography>

        <Paper elevation={1} style={{ padding: '24px' }}>
          <Form<TmdbRawFormData> validate={isTmdbRawFormData} onSubmit={(data) => void handleSubmit(data)}>
            <div className="form-field">
              <div className="api-key-row">
                <Input
                  labelTitle="API Read Access Token"
                  name="apiKey"
                  type={isApiKeyVisible ? 'text' : 'password'}
                  value={currentValues.apiKey}
                  placeholder="Enter your TMDB API Read Access Token"
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
              <small className="field-hint">
                Get your API key at{' '}
                <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer">
                  themoviedb.org
                </a>
              </small>
            </div>

            <div className="form-field">
              <Input
                labelTitle="Default Language"
                name="defaultLanguage"
                type="text"
                value={currentValues.defaultLanguage}
                placeholder="en-US"
              />
              <small className="field-hint">
                Primary language for metadata (TMDB locale format, e.g. en-US, fr-FR, de-DE)
              </small>
            </div>

            <div className="form-field">
              <Input
                labelTitle="Additional Languages"
                name="additionalLanguages"
                type="text"
                value={currentValues.additionalLanguages.join(', ')}
                placeholder="fr-FR, de-DE, es-ES"
              />
              <small className="field-hint">
                Comma-separated list of additional languages to fetch alongside the default
              </small>
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

export const TmdbSettingsPage = Shade({
  customElementName: 'tmdb-settings-page',
  render: ({ injector }) => {
    const configService = injector.get(ConfigService)

    return (
      <PageContainer gap="24px">
        <PageHeader icon={<Icon icon={icons.film} />} title="TMDB Settings" />
        <CacheView
          cache={configService.configCache}
          args={['TMDB_CONFIG']}
          content={TmdbSettingsContent}
          loader={<Skeleton />}
          error={(err, retry) => <GenericErrorPage error={err} retry={async () => retry()} />}
        />
      </PageContainer>
    )
  },
})
