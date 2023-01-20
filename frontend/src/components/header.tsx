import { createComponent, RouteLink, Shade } from '@furystack/shades'
import { AppBar, Button } from '@furystack/shades-common-components'
import { environmentOptions } from '../environment-options'
import { SessionService } from '../services/session'
import { GithubLogo } from './github-logo'
import { ThemeSwitch } from './theme-switch'

export interface HeaderProps {
  title: string
  links: Array<{ name: string; url: string }>
}

const urlStyle: Partial<CSSStyleDeclaration> = {
  color: '#aaa',
  textDecoration: 'none',
}

export const Header = Shade<HeaderProps>({
  shadowDomName: 'shade-app-header',
  render: ({ props, injector, useObservable }) => {
    const [sessionState] = useObservable('sessionState', injector.getInstance(SessionService).state)
    return (
      <AppBar id="header">
        <h3 style={{ margin: '0 2em 0 0', cursor: 'pointer' }}>
          <RouteLink title={props.title} href="/" style={urlStyle}>
            {props.title}
          </RouteLink>
        </h3>
        {props.links.map((link) => (
          <RouteLink title={link.name} href={link.url} style={{ ...urlStyle, padding: '0 8px', cursor: 'pointer' }}>
            {link.name || ''}
          </RouteLink>
        ))}
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
