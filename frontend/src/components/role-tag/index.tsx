import { createComponent, Shade } from '@furystack/shades'
import { cssVariableTheme } from '@furystack/shades-common-components'
import type { Roles } from 'common'
import { getRoleDefinition } from 'common'

type RoleTagProps = {
  roleName: Roles[number]
  variant: 'default' | 'added' | 'removed'
  onRemove?: () => void
  onRestore?: () => void
}

export const RoleTag = Shade<RoleTagProps>({
  customElementName: 'role-tag',
  css: {
    '& button': {
      opacity: '0.7',
      transition: 'opacity 0.2s ease',
    },
    '& button:hover': {
      opacity: '1',
    },
  },
  render: ({ props }) => {
    const role = getRoleDefinition(props.roleName)
    const baseStyle: Partial<CSSStyleDeclaration> = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: cssVariableTheme.shape.borderRadius.md,
      fontSize: cssVariableTheme.typography.fontSize.sm,
      fontWeight: '500',
      transition: 'all 0.2s ease',
    }

    const variantStyles: Record<RoleTagProps['variant'], Partial<CSSStyleDeclaration>> = {
      default: {
        backgroundColor: cssVariableTheme.background.paper,
        border: `1px solid ${cssVariableTheme.action.subtleBorder}`,
        color: cssVariableTheme.text.primary,
      },
      added: {
        backgroundColor: cssVariableTheme.palette.success.light,
        border: `1px solid ${cssVariableTheme.palette.success.main}`,
        color: cssVariableTheme.palette.success.dark,
      },
      removed: {
        backgroundColor: cssVariableTheme.palette.error.light,
        border: `1px solid ${cssVariableTheme.palette.error.main}`,
        color: cssVariableTheme.palette.error.dark,
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
      fontSize: cssVariableTheme.typography.fontSize.sm,
      lineHeight: '1',
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
              color: cssVariableTheme.palette.error.dark,
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
              color:
                props.variant === 'added' ? cssVariableTheme.palette.success.dark : cssVariableTheme.text.secondary,
            }}
          >
            ×
          </button>
        )}
      </span>
    )
  },
})
