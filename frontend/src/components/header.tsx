import { createComponent, Shade } from '@furystack/shades'
import { AppBar, AppBarLink, Button, ThemeProviderService } from '@furystack/shades-common-components'
import { environmentOptions } from '../environment-options'
import type { SessionState } from '../services/session'
import { SessionService } from '../services/session'
import { GithubLogo } from './github-logo'
import { ThemeSwitch } from './theme-switch'

export interface HeaderProps {
  title: string
  links: Array<{ name: string; url: string }>
}

export const Header = Shade<HeaderProps, { sessionState: SessionState; themeProvider: ThemeProviderService }>({
  shadowDomName: 'shade-app-header',
  getInitialState: ({ injector }) => ({
    sessionState: injector.getInstance(SessionService).state.getValue(),
    themeProvider: injector.getInstance(ThemeProviderService),
  }),
  resources: ({ injector, updateState }) => {
    return [
      injector.getInstance(SessionService).state.subscribe((newState) => {
        updateState({ sessionState: newState })
      }),
    ]
  },
  render: ({ props, injector, getState }) => {
    const { sessionState } = getState()
    return (
      <AppBar id="header">
        <AppBarLink title={props.title} href="/">
          {props.title}
        </AppBarLink>
        {sessionState === 'authenticated'
          ? props.links.map((link) => (
              <AppBarLink title={link.name} href={link.url}>
                {link.name || ''}
              </AppBarLink>
            ))
          : null}
        <div style={{ flex: '1' }} />
        <div style={{ display: 'flex', placeContent: 'center', marginRight: '24px' }}>
          <ThemeSwitch variant="outlined" />
          <a href={environmentOptions.repository} target="_blank">
            <Button variant="outlined" style={{ verticalAlign: 'baseline' }}>
              <GithubLogo style={{ height: '1em' }} />
            </Button>
          </a>
          {sessionState === 'authenticated' ? (
            <Button variant="outlined" onclick={() => injector.getInstance(SessionService).logout()}>
              Log Out
            </Button>
          ) : null}
        </div>
      </AppBar>
    )
  },
})
