import { createComponent, Shade } from '@furystack/shades'
import { Paper } from '@furystack/shades-common-components'

export const AppSettingsPage = Shade({
  shadowDomName: 'app-settings-page',
  render: () => {
    return (
      <div
        style={{
          padding: '48px',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <h1
          style={{
            marginBottom: '32px',
            color: 'var(--theme-text-primary)',
            borderBottom: '2px solid var(--theme-primary-main)',
            paddingBottom: '8px',
          }}
        >
          Application Settings
        </h1>

        <Paper elevation={1} style={{ padding: '24px' }}>
          <p style={{ color: 'var(--theme-text-secondary)' }}>Application settings will be available here.</p>
        </Paper>
      </div>
    )
  },
})
