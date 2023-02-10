import { createComponent, Shade, LazyLoad } from '@furystack/shades'
import { NotyList } from '@furystack/shades-common-components'
import { Button, Loader, Paper, ThemeProviderService } from '@furystack/shades-common-components'
import { InstallApiClient } from '../services/install-api-client'
import { Body } from './body'
import { Header } from './header'

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
        <div style={{ zIndex: '2' }}>
          <NotyList />
        </div>
        <LazyLoad
          loader={<Loader style={{ width: '100px', height: '100px', alignSelf: 'center', justifySelf: 'center' }} />}
          error={(error, retry) => (
            <Paper>
              <h1>Cannot reach the service</h1>
              <p>{error?.toString()}</p>
              <Button onclick={retry}>Retry</Button>
            </Paper>
          )}
          component={async () => {
            const { result } = await injector.getInstance(InstallApiClient).call({
              method: 'GET',
              action: '/serviceStatus',
            })
            if (result.state === 'installed') {
              return (
                <>
                  <Header title="🐀 PI-Rat" />
                  <Body style={{ width: '100%', height: '100%', overflow: 'auto', position: 'fixed' }} />
                </>
              )
            } else {
              const { InstallerPage } = await import('../installer')
              return <InstallerPage />
            }
          }}
        />
      </div>
    )
  },
})
