import { createComponent, LocationService, RouteLink, Shade } from '@furystack/shades'
import { cssVariableTheme } from '@furystack/shades-common-components'
import { match, type MatchOptions } from 'path-to-regexp'

type SettingsMenuItemProps = {
  icon: string
  label: string
  href: string
  routingOptions?: MatchOptions
}

export const SettingsMenuItem = Shade<SettingsMenuItemProps>({
  shadowDomName: 'settings-menu-item',
  render: ({ props, injector, useObservable }) => {
    const { icon, label, href, routingOptions } = props

    const [currentPath] = useObservable('locationChange', injector.getInstance(LocationService).onLocationPathChanged)
    const isActive = !!match(href, routingOptions)(currentPath)

    return (
      <RouteLink
        href={href}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          textDecoration: 'none',
          color: isActive ? cssVariableTheme.text.primary : cssVariableTheme.text.secondary,
          backgroundColor: isActive ? cssVariableTheme.background.paper : 'transparent',
          borderLeft: isActive ? `3px solid ${cssVariableTheme.palette.primary.main}` : '3px solid transparent',
          borderRadius: '0 6px 6px 0',
          cursor: 'pointer',
          transition: 'background-color 0.15s ease, color 0.15s ease',
        }}
        onmouseenter={(e) => {
          if (!isActive) {
            const target = e.currentTarget as HTMLElement
            target.style.backgroundColor = cssVariableTheme.background.paper
          }
        }}
        onmouseleave={(e) => {
          if (!isActive) {
            const target = e.currentTarget as HTMLElement
            target.style.backgroundColor = 'transparent'
          }
        }}
      >
        <span style={{ fontSize: '16px', lineHeight: '1' }}>{icon}</span>
        <span style={{ fontSize: '14px' }}>{label}</span>
      </RouteLink>
    )
  },
})
