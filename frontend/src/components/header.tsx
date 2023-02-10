import { createComponent, Shade } from '@furystack/shades'
import { AppBar, AppBarLink, Button } from '@furystack/shades-common-components'
import { environmentOptions } from '../environment-options'
import { SessionService } from '../services/session'
import { GithubLogo } from './github-logo'
import { ThemeSwitch } from './theme-switch'

export interface HeaderProps {
  title: string
  links: Array<{ name: string; url: string }>
}

export const Header = Shade<HeaderProps>({
  shadowDomName: 'shade-app-header',
  render: ({ props, injector, useObservable }) => {
    const [sessionState] = useObservable('sessionState', injector.getInstance(SessionService).state)
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
