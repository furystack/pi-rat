import type { CacheWithValue } from '@furystack/cache'
import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  CacheView,
  cssVariableTheme,
  Form,
  Typography,
  Input,
  NotyService,
  PageContainer,
  PageHeader,
  Paper,
  Select,
  Skeleton,
  Switch,
} from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { Config, MoviesConfig } from 'common'
import { GenericErrorPage } from '../../components/generic-error.js'
import { ConfigService } from '../../services/config-service.js'

type StreamingFormData = MoviesConfig['value']

export type StreamingRawFormData = {
  autoExtractSubtitles?: string
  fullSyncOnStartup?: string
  preset: string
  threads: string
  watchFiles?: string
}

export const isStreamingRawFormData = (data: unknown): data is StreamingRawFormData => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  const threads = Number(d.threads)
  return typeof d.threads === 'string' && !isNaN(threads) && threads >= 1 && threads <= 64
}

const PRESET_OPTIONS = [
  { value: 'ultrafast', label: 'Ultra Fast' },
  { value: 'superfast', label: 'Super Fast' },
  { value: 'veryfast', label: 'Very Fast' },
  { value: 'faster', label: 'Faster' },
  { value: 'fast', label: 'Fast' },
  { value: 'medium', label: 'Medium (Balanced)' },
  { value: 'slow', label: 'Slow' },
  { value: 'slower', label: 'Slower' },
  { value: 'veryslow', label: 'Very Slow (Best Quality)' },
] as const

const StreamingSettingsContent = Shade<{ data: CacheWithValue<Config> }>({
  shadowDomName: 'streaming-settings-content',
  css: {
    '& .page-description': {
      marginBottom: '24px',
      color: cssVariableTheme.text.secondary,
    },
    '& .section-title': {
      marginBottom: '16px',
      color: cssVariableTheme.text.primary,
      fontSize: cssVariableTheme.typography.fontSize.lg,
    },
    '& .form-field': {
      marginBottom: '24px',
    },
    '& .switch-description': {
      color: cssVariableTheme.text.secondary,
    },
    '& .section-divider': {
      borderTop: `1px solid ${cssVariableTheme.background.default}`,
      margin: '24px 0',
      paddingTop: '24px',
    },
    '& .field-hint': {
      color: cssVariableTheme.text.secondary,
      display: 'block',
      marginTop: '4px',
    },
    '& .form-footer': {
      borderTop: `1px solid ${cssVariableTheme.background.default}`,
      paddingTop: '16px',
    },
  },
  render: ({ props, injector, useObservable, useDisposable }) => {
    const configService = injector.getInstance(ConfigService)
    const notyService = injector.getInstance(NotyService)

    const isLoadingObservable = useDisposable('isLoading', () => new ObservableValue(false))
    const [isLoading] = useObservable('isLoadingValue', isLoadingObservable)

    const handleSubmit = async (formData: StreamingRawFormData) => {
      const data: StreamingFormData = {
        autoExtractSubtitles: formData.autoExtractSubtitles === 'on',
        fullSyncOnStartup: formData.fullSyncOnStartup === 'on',
        preset: formData.preset as StreamingFormData['preset'],
        threads: Number(formData.threads),
        watchFiles: formData.watchFiles === 'all' ? 'all' : [],
      }

      isLoadingObservable.setValue(true)
      try {
        await configService.saveConfig('MOVIES_CONFIG', data)
        notyService.emit('onNotyAdded', {
          title: 'Success',
          body: 'Streaming settings saved successfully',
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

    const currentValues: StreamingFormData = props.data.value.value
      ? (props.data.value.value as StreamingFormData)
      : {
          autoExtractSubtitles: false,
          fullSyncOnStartup: false,
          preset: 'medium',
          threads: 4,
          watchFiles: 'all',
        }

    return (
      <>
        <Typography variant="body1" className="page-description">
          Configure media transcoding and file watching settings.
        </Typography>

        <Paper elevation={1} style={{ padding: '24px' }}>
          <Form<StreamingRawFormData> validate={isStreamingRawFormData} onSubmit={(data) => void handleSubmit(data)}>
            <Typography variant="h3" className="section-title">
              File Discovery
            </Typography>

            <div className="form-field">
              <Switch
                name="autoExtractSubtitles"
                checked={currentValues.autoExtractSubtitles ?? false}
                labelTitle={
                  <div>
                    <div>Auto-extract subtitles</div>
                    <small className="switch-description">
                      Automatically extract embedded subtitles when new media files are discovered
                    </small>
                  </div>
                }
              />
            </div>

            <div className="form-field">
              <Switch
                name="fullSyncOnStartup"
                checked={currentValues.fullSyncOnStartup ?? false}
                labelTitle={
                  <div>
                    <div>Full sync on startup</div>
                    <small className="switch-description">
                      Scan all configured drives for media files when the service starts
                    </small>
                  </div>
                }
              />
            </div>

            <div className="form-field">
              <Switch
                name="watchFiles"
                checked={currentValues.watchFiles === 'all'}
                value="all"
                labelTitle={
                  <div>
                    <div>Watch all files</div>
                    <small className="switch-description">
                      Monitor all drives for new media files (uncheck for custom drive configuration via advanced
                      settings)
                    </small>
                  </div>
                }
              />
            </div>

            <div className="section-divider">
              <Typography variant="h3" className="section-title">
                Transcoding
              </Typography>

              <div className="form-field">
                <Select
                  name="preset"
                  labelTitle="Preset"
                  options={PRESET_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  value={currentValues.preset}
                  style={{ maxWidth: '300px' }}
                />
                <small className="field-hint">
                  Faster presets = lower quality, slower presets = better quality at the cost of encoding time
                </small>
              </div>

              <div className="form-field">
                <Input
                  labelTitle="Threads"
                  name="threads"
                  type="number"
                  value={currentValues.threads?.toString() ?? ''}
                  placeholder="Enter number of threads"
                  min="1"
                  max="64"
                  required
                  style={{ maxWidth: '150px' }}
                />
                <small className="field-hint">Number of CPU threads for transcoding (1-64).</small>
              </div>
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

export const StreamingSettingsPage = Shade({
  shadowDomName: 'streaming-settings-page',
  render: ({ injector }) => {
    const configService = injector.getInstance(ConfigService)

    return (
      <PageContainer gap="24px">
        <PageHeader title="📺 Streaming Settings" />
        <CacheView
          cache={configService.configCache}
          args={['MOVIES_CONFIG']}
          content={StreamingSettingsContent}
          loader={<Skeleton />}
          error={(err, retry) => <GenericErrorPage error={err} retry={async () => retry()} />}
        />
      </PageContainer>
    )
  },
})
