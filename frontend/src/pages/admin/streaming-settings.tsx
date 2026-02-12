import { createComponent, Shade } from '@furystack/shades'
import { Button, Form, Input, NotyService, Paper } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { MoviesConfig } from 'common'
import { ConfigService } from '../../services/config-service.js'

type StreamingFormData = MoviesConfig['value']

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

export const StreamingSettingsPage = Shade({
  shadowDomName: 'streaming-settings-page',
  css: {
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
    '& .section-title': {
      marginBottom: '16px',
      color: 'var(--theme-text-primary)',
      fontSize: '16px',
    },
    '& .form-field': {
      marginBottom: '24px',
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
    '& .section-divider': {
      borderTop: '1px solid var(--theme-background-default)',
      margin: '24px 0',
      paddingTop: '24px',
    },
    '& .select-label': {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: 'var(--theme-text-primary)',
    },
    '& .select-input': {
      width: '100%',
      maxWidth: '300px',
      padding: '8px 12px',
      fontSize: '14px',
      borderRadius: '4px',
      border: '1px solid var(--theme-background-paper)',
      backgroundColor: 'var(--theme-background-default)',
      color: 'var(--theme-text-primary)',
      cursor: 'pointer',
    },
    '& .field-hint': {
      color: 'var(--theme-text-secondary)',
      display: 'block',
      marginTop: '4px',
    },
    '& .form-footer': {
      borderTop: '1px solid var(--theme-background-default)',
      paddingTop: '16px',
    },
  },
  render: ({ injector, useObservable, useDisposable }) => {
    const configService = injector.getInstance(ConfigService)
    const notyService = injector.getInstance(NotyService)

    const [config] = useObservable('moviesConfig', configService.getConfigAsObservable('MOVIES_CONFIG'))

    const isLoadingObservable = useDisposable('isLoading', () => new ObservableValue(false))
    const [isLoading] = useObservable('isLoadingValue', isLoadingObservable)

    const handleSubmit = async (formData: Record<string, unknown>) => {
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

    if (config.status === 'loading') {
      return (
        <div>
          <h2 className="page-title">📺 Streaming Settings</h2>
          <Paper elevation={1} style={{ padding: '24px' }}>
            <p className="loading-text">Loading settings...</p>
          </Paper>
        </div>
      )
    }

    const currentValues: StreamingFormData =
      config.status === 'loaded' && config.value
        ? (config.value.value as StreamingFormData)
        : {
            autoExtractSubtitles: false,
            fullSyncOnStartup: false,
            preset: 'medium',
            threads: 4,
            watchFiles: 'all',
          }

    return (
      <div>
        <h2 className="page-title">📺 Streaming Settings</h2>
        <p className="page-description">Configure media transcoding and file watching settings.</p>

        <Paper elevation={1} style={{ padding: '24px' }}>
          <Form<Record<string, unknown>>
            validate={(data): data is Record<string, unknown> => {
              const formData = data as Record<string, unknown>
              const threads = Number(formData.threads)
              return !isNaN(threads) && threads >= 1 && threads <= 64
            }}
            onSubmit={(data) => void handleSubmit(data)}
          >
            <h3 className="section-title">File Discovery</h3>

            <div className="form-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="autoExtractSubtitles"
                  checked={currentValues.autoExtractSubtitles ?? false}
                />
                <div>
                  <div className="checkbox-title">Auto-extract subtitles</div>
                  <small className="checkbox-description">
                    Automatically extract embedded subtitles when new media files are discovered
                  </small>
                </div>
              </label>
            </div>

            <div className="form-field">
              <label className="checkbox-label">
                <input type="checkbox" name="fullSyncOnStartup" checked={currentValues.fullSyncOnStartup ?? false} />
                <div>
                  <div className="checkbox-title">Full sync on startup</div>
                  <small className="checkbox-description">
                    Scan all configured drives for media files when the service starts
                  </small>
                </div>
              </label>
            </div>

            <div className="form-field">
              <label className="checkbox-label">
                <input type="checkbox" name="watchFiles" checked={currentValues.watchFiles === 'all'} value="all" />
                <div>
                  <div className="checkbox-title">Watch all files</div>
                  <small className="checkbox-description">
                    Monitor all drives for new media files (uncheck for custom drive configuration via advanced
                    settings)
                  </small>
                </div>
              </label>
            </div>

            <div className="section-divider">
              <h3 className="section-title">Transcoding</h3>

              <div className="form-field">
                <label className="select-label">Preset</label>
                <select name="preset" className="select-input">
                  {PRESET_OPTIONS.map((option) => (
                    <option value={option.value} selected={currentValues.preset === option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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
      </div>
    )
  },
})
