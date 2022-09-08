import { createComponent, createFragment, Shade, LazyLoad } from '@furystack/shades'
import { Loader, ThemeProviderService } from '@furystack/shades-common-components'
import { PiratApiClient } from '../services/pirat-api-client'
import { Body } from './body'
import { Header } from './header'

export const Layout = Shade({
  shadowDomName: 'shade-app-layout',
  resources: ({ injector, element }) => [
    injector.getInstance(ThemeProviderService).theme.subscribe((newTheme) => {
      ;(element.firstChild as any).style.background = newTheme.background.default
    }),
  ],
  render: ({ injector }) => {
    return (
      <div
        id="Layout"
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          lineHeight: '1.6',
          overflow: 'hidden',
          padding: '0',
          margin: '0',
          backgroundColor: injector.getInstance(ThemeProviderService).theme.getValue().background.default,
        }}>
        <LazyLoad
          loader={<Loader />}
          component={async () => {
            const { result } = await injector.getInstance(PiratApiClient).call({
              method: 'GET',
              action: '/serviceStatus',
            })
            if (result.state === 'installed') {
              return (
                <>
                  <Header title="🐀 PI-Rat" links={[]} />
                  <Body style={{ width: '100%', height: '100%', overflow: 'auto' }} />
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
