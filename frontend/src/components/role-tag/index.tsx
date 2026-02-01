import { createComponent, Shade } from '@furystack/shades'
import type { Roles } from 'common'
import { getRoleDefinition } from 'common'

type RoleTagProps = {
  roleName: Roles[number]
  variant: 'default' | 'added' | 'removed'
  onRemove?: () => void
  onRestore?: () => void
}

export const RoleTag = Shade<RoleTagProps>({
  shadowDomName: 'role-tag',
  render: ({ props }) => {
    const role = getRoleDefinition(props.roleName)
    const baseStyle: Partial<CSSStyleDeclaration> = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: '16px',
      fontSize: '13px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
    }

    const variantStyles: Record<RoleTagProps['variant'], Partial<CSSStyleDeclaration>> = {
      default: {
        backgroundColor: 'var(--theme-background-paper)',
        border: '1px solid var(--theme-border-default)',
        color: 'var(--theme-text-primary)',
      },
      added: {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        border: '1px solid var(--theme-success-main, #4caf50)',
        color: 'var(--theme-success-dark, #2e7d32)',
      },
      removed: {
        backgroundColor: 'rgba(244, 67, 54, 0.15)',
        border: '1px solid var(--theme-error-main, #f44336)',
        color: 'var(--theme-error-dark, #c62828)',
        textDecoration: 'line-through',
      },
    }

    const buttonBaseStyle: Partial<CSSStyleDeclaration> = {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '0',
      margin: '0',
      marginLeft: '4px',
      fontSize: '14px',
      lineHeight: '1',
      opacity: '0.7',
      transition: 'opacity 0.2s ease',
    }

    const style = { ...baseStyle, ...variantStyles[props.variant] }

    return (
      <span style={style} title={role.description}>
        {role.displayName}
        {props.variant === 'removed' && props.onRestore && (
          <button
            type="button"
            onclick={(e) => {
              e.stopPropagation()
              props.onRestore?.()
            }}
            title="Restore role"
            style={{
              ...buttonBaseStyle,
              color: 'var(--theme-error-dark, #c62828)',
            }}
            onmouseenter={(e) => {
              ;(e.target as HTMLButtonElement).style.opacity = '1'
            }}
            onmouseleave={(e) => {
              ;(e.target as HTMLButtonElement).style.opacity = '0.7'
            }}
          >
            ↩
          </button>
        )}
        {props.variant !== 'removed' && props.onRemove && (
          <button
            type="button"
            onclick={(e) => {
              e.stopPropagation()
              props.onRemove?.()
            }}
            title="Remove role"
            style={{
              ...buttonBaseStyle,
              color: props.variant === 'added' ? 'var(--theme-success-dark, #2e7d32)' : 'var(--theme-text-secondary)',
            }}
            onmouseenter={(e) => {
              ;(e.target as HTMLButtonElement).style.opacity = '1'
            }}
            onmouseleave={(e) => {
              ;(e.target as HTMLButtonElement).style.opacity = '0.7'
            }}
          >
            ×
          </button>
        )}
      </span>
    )
  },
})
