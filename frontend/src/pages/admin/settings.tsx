import { createComponent, Shade } from '@furystack/shades'
import {
  cssVariableTheme,
  Icon,
  icons,
  PageContainer,
  PageHeader,
  Paper,
  Typography,
} from '@furystack/shades-common-components'

export const AdminSettingsPage = Shade({
  shadowDomName: 'admin-settings-page',
  render: () => {
    return (
      <PageContainer gap={cssVariableTheme.spacing.lg}>
        <PageHeader icon={<Icon icon={icons.settings} />} title="Application Administration" />
        <Paper elevation={1} style={{ padding: '24px' }}>
          <Typography variant="body1" color="textSecondary">
            Application administration settings will be available here.
          </Typography>
        </Paper>
      </PageContainer>
    )
  },
})
