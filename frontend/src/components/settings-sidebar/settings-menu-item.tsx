import { createComponent, LocationService, NestedRouteLink, Shade } from '@furystack/shades'
import { cssVariableTheme } from '@furystack/shades-common-components'
import { match, type MatchOptions } from 'path-to-regexp'
import type { AppPaths } from '../../app-routes.js'

type SettingsMenuItemProps = {
  icon: string
  label: string
  href: AppPaths
  routingOptions?: MatchOptions
}

export const SettingsMenuItem = Shade<SettingsMenuItemProps>({
  shadowDomName: 'settings-menu-item',
  css: {
    '& a': {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      textDecoration: 'none',
      borderRadius: '0 6px 6px 0',
      cursor: 'pointer',
      transition: 'background-color 0.15s ease, color 0.15s ease',
    },
    '& a:hover': {
      backgroundColor: cssVariableTheme.background.paper,
    },
    '& .menu-icon': {
      fontSize: '16px',
      lineHeight: '1',
    },
    '& .menu-label': {
      fontSize: '14px',
    },
  },
  render: ({ props, injector, useObservable }) => {
    const { icon, label, href, routingOptions } = props

    const [currentPath] = useObservable('locationChange', injector.getInstance(LocationService).onLocationPathChanged)
    const isActive = !!match(href, routingOptions)(currentPath)

    const hrefString: string = href

    return (
      <NestedRouteLink
        href={hrefString}
        style={{
          color: isActive ? cssVariableTheme.text.primary : cssVariableTheme.text.secondary,
          backgroundColor: isActive ? cssVariableTheme.background.paper : 'transparent',
          borderLeft: isActive ? `3px solid ${cssVariableTheme.palette.primary.main}` : '3px solid transparent',
        }}
      >
        <span className="menu-icon">{icon}</span>
        <span className="menu-label">{label}</span>
      </NestedRouteLink>
    )
  },
})
