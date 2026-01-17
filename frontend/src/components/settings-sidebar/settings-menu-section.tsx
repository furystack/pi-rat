import { createComponent, Shade } from '@furystack/shades'
import { cssVariableTheme } from '@furystack/shades-common-components'

type SettingsMenuSectionProps = {
  title: string
}

export const SettingsMenuSection = Shade<SettingsMenuSectionProps>({
  shadowDomName: 'settings-menu-section',
  render: ({ props, children }) => {
    const { title } = props

    return (
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: cssVariableTheme.text.secondary,
            padding: '8px 12px',
          }}
        >
          {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>{children}</div>
      </div>
    )
  },
})
