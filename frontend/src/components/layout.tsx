import { createComponent, Shade } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'
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
        <Header title="🧩 FuryStack Boilerplate" links={[]} />
        <Body style={{ width: '100%', height: '100%', overflow: 'auto' }} />
      </div>
    )
  },
})
