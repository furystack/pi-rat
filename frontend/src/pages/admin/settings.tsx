import { createComponent, Shade } from '@furystack/shades'
import { cssVariableTheme, Paper, Typography } from '@furystack/shades-common-components'

export const AdminSettingsPage = Shade({
  shadowDomName: 'admin-settings-page',
  render: () => {
    return (
      <div
        style={{
          padding: '48px',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <Typography
          variant="h1"
          style={{
            marginBottom: '32px',
            borderBottom: `2px solid ${cssVariableTheme.palette.primary.main}`,
            paddingBottom: '8px',
          }}
        >
          Application Administration
        </Typography>

        <Paper elevation={1} style={{ padding: '24px' }}>
          <Typography variant="body1" color="textSecondary">
            Application administration settings will be available here.
          </Typography>
        </Paper>
      </div>
    )
  },
})
