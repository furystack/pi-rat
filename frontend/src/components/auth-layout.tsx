import { createComponent, Shade } from '@furystack/shades'
import { cssVariableTheme, promisifyAnimation } from '@furystack/shades-common-components'

import { PiRatLogo } from './pi-rat-logo.js'

type AuthLayoutProps = {
  title: string
  subtitle: string
}

export const AuthLayout = Shade<AuthLayoutProps>({
  shadowDomName: 'pi-rat-auth-layout',
  css: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: cssVariableTheme.spacing.lg,

    '& .auth-card': {
      width: '100%',
      maxWidth: '420px',
      padding: `${cssVariableTheme.spacing.xl} ${cssVariableTheme.spacing.lg}`,
      background: cssVariableTheme.action.backdrop,
      backdropFilter: `blur(${cssVariableTheme.effects.blurMd})`,
      borderRadius: cssVariableTheme.shape.borderRadius.md,
      border: `1px solid ${cssVariableTheme.action.subtleBorder}`,
      boxShadow: cssVariableTheme.shadows.lg,
      transform: 'scale(0.95)',
      opacity: '0',
    },

    '& .auth-header': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: cssVariableTheme.spacing.xl,
    },

    '& .auth-logo': {
      marginBottom: cssVariableTheme.spacing.md,
      filter: `drop-shadow(${cssVariableTheme.shadows.md})`,
    },

    '& .auth-title': {
      fontSize: cssVariableTheme.typography.fontSize.lg,
      fontWeight: '600',
      color: cssVariableTheme.text.primary,
      margin: `0 0 ${cssVariableTheme.spacing.xs} 0`,
    },

    '& .auth-subtitle': {
      fontSize: cssVariableTheme.typography.fontSize.sm,
      color: cssVariableTheme.text.secondary,
      margin: '0',
    },
  },
  render: ({ props, useRef, useDisposable, children }) => {
    const cardRef = useRef<HTMLElement>('card')

    useDisposable('entryAnimation', () => {
      const id = setTimeout(() => {
        const el = cardRef.current
        if (el) {
          void promisifyAnimation(
            el,
            [
              { transform: 'scale(0.95)', opacity: '0' },
              { transform: 'scale(1)', opacity: '1' },
            ],
            { duration: 400, fill: 'forwards', easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
          )
        }
      }, 50)
      return { [Symbol.dispose]: () => clearTimeout(id) }
    })

    return (
      <div ref={cardRef} className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <PiRatLogo size={80} />
          </div>
          <h2 className="auth-title">{props.title}</h2>
          <p className="auth-subtitle">{props.subtitle}</p>
        </div>
        {children}
      </div>
    )
  },
})
