import { createComponent, Shade } from '@furystack/shades'
import { NotyList } from '@furystack/shades-common-components'
import { ThemeProviderService } from '@furystack/shades-common-components'
import { Body } from './body.js'
import { Header } from './header.js'
import { PiRatLazyLoad } from './pirat-lazy-load.js'
import { InstallService } from '../services/install-service.js'

export const Layout = Shade({
  shadowDomName: 'shade-app-layout',
  render: ({ injector }) => {
    const { theme } = injector.getInstance(ThemeProviderService)
    return (
      <div
        id="Layout"
        style={{
          width: '100%',
          height: '100%',
          position: 'fixed',
          top: '0',
          left: '0',
          padding: '0',
          margin: '0',
          background: theme.background.default,
        }}>
        <div style={{ zIndex: '2', position: 'fixed' }}>
          <NotyList />
        </div>
        <PiRatLazyLoad
          component={async () => {
            const result = await injector.getInstance(InstallService).getServiceStatus()
            if (result.state === 'installed') {
              return (
                <>
                  <Header title="🐀 PI-Rat" />
                  <Body style={{ width: '100%', height: '100%', overflow: 'auto', position: 'fixed' }} />
                </>
              )
            } else if (result.state === 'needsInstall') {
              const { InstallerPage } = await import('../installer/index.js')
              return <InstallerPage />
            } else {
              throw Error(`Cannot fetch the service status. Maybe the backend is not running?`)
            }
          }}
        />
      </div>
    )
  },
})
