import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  cssVariableTheme,
  Icon,
  icons,
  PageContainer,
  PageHeader,
  Paper,
  Typography,
} from '@furystack/shades-common-components'

import { environmentOptions } from '../environment-options.js'
import { PiRatLogo } from '../components/pi-rat-logo.js'

const APP_VERSION = '1.0.18'

export const AboutPage = Shade({
  shadowDomName: 'about-page',
  css: {
    '& .about-card': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: cssVariableTheme.spacing.lg,
      padding: cssVariableTheme.spacing.xl,
    },
    '& .about-version': {
      color: cssVariableTheme.text.secondary,
      fontSize: cssVariableTheme.typography.fontSize.sm,
    },
  },
  render: () => {
    return (
      <PageContainer gap={cssVariableTheme.spacing.lg}>
        <PageHeader icon={<Icon icon={icons.info} />} title="About" />
        <Paper elevation={1}>
          <div className="about-card">
            <PiRatLogo size={80} />
            <Typography variant="h3" style={{ margin: '0' }}>
              PI-Rat
            </Typography>
            <span className="about-version">Version {APP_VERSION}</span>
            <Button variant="outlined" onclick={() => window.open(environmentOptions.repository, '_blank')}>
              <Icon icon={icons.externalLink} size="small" /> View on GitHub
            </Button>
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
