import { createComponent, Shade } from '@furystack/shades'
import { cssVariableTheme } from '@furystack/shades-common-components'

export const SettingsSidebar = Shade({
  shadowDomName: 'settings-sidebar',
  css: {
    display: 'block',
    width: '240px',
    minWidth: '240px',
    height: '100%',
    borderRight: `1px solid ${cssVariableTheme.background.paper}`,
    padding: '16px 0',
    overflowY: 'auto',
  },
  render: ({ children }) => {
    return <nav>{children}</nav>
  },
})
