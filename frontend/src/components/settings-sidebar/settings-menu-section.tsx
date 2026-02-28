import { createComponent, Shade } from '@furystack/shades'
import { cssVariableTheme } from '@furystack/shades-common-components'

type SettingsMenuSectionProps = {
  title: string
}

export const SettingsMenuSection = Shade<SettingsMenuSectionProps>({
  shadowDomName: 'settings-menu-section',
  css: {
    display: 'block',
    marginBottom: '16px',
    '& .section-title': {
      fontSize: cssVariableTheme.typography.fontSize.xs,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: cssVariableTheme.text.secondary,
      padding: '8px 12px',
    },
    '& .section-content': {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
    },
  },
  render: ({ props, children }) => {
    const { title } = props

    return (
      <>
        <div className="section-title">{title}</div>
        <div className="section-content">{children}</div>
      </>
    )
  },
})
