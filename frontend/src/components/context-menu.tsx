import { createComponent, Shade } from '@furystack/shades'
import { collapse, expand, Paper } from '@furystack/shades-common-components'
import type { Icon as IconModel } from 'common'
import { Icon } from './Icon.js'

type MenuItemProps = {
  icon: IconModel
  label: string
  onClick: () => void
}

const MenuItem = Shade<MenuItemProps>({
  shadowDomName: 'shade-app-menu-item',
  css: {
    '& .menu-item': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: '8px',
      cursor: 'pointer',
      transition: 'background-color 0.15s ease',
    },
    '& .menu-item:hover': {
      backgroundColor: 'rgba(0,0,0,0.1)',
    },
    '& .menu-icon': {
      minWidth: '24px',
      paddingRight: '8px',
      textAlign: 'center',
      lineHeight: '100%',
    },
    '& .menu-label': {
      lineHeight: '100%',
    },
  },
  render: ({ props }) => {
    return (
      <div className="menu-item" onclick={props.onClick}>
        <div className="menu-icon">
          <Icon {...props.icon} />
        </div>
        <div className="menu-label">{props.label}</div>
      </div>
    )
  },
})

type ContextMenuProps = {
  items: MenuItemProps[]
}

export const ContextMenu = Shade<ContextMenuProps>({
  shadowDomName: 'shade-app-context-menu',
  css: {
    '& .menuItems': {
      display: 'none',
      opacity: '0',
      position: 'fixed',
      zIndex: '1',
      margin: '0',
      padding: '0',
      background: 'rgba(0,0,0,0.07)',
      backdropFilter: 'blur(20px)',
    },
  },
  render: ({ props, useDisposable, children, useRef }) => {
    const { items } = props
    const menuRef = useRef<HTMLElement>('menuItems')

    useDisposable('windowListeners', () => {
      const listener = () => {
        const menu = menuRef.current
        if (menu) {
          menu.getAnimations().forEach((a) => a.cancel())
          void collapse(menu).then(() => {
            menu.style.display = 'none'
            menu.style.opacity = '0'
          })
        }
      }
      window.addEventListener('click', listener)
      window.addEventListener('contextmenu', listener)
      return {
        [Symbol.dispose]: () => {
          window.removeEventListener('click', listener)
          window.removeEventListener('contextmenu', listener)
        },
      }
    })

    return (
      <div
        oncontextmenu={(ev) => {
          ev.preventDefault()
          setTimeout(() => {
            const menu = menuRef.current
            if (menu) {
              menu.getAnimations().forEach((a) => a.cancel())
              menu.style.display = 'block'
              menu.style.top = `${ev.clientY}px`
              menu.style.left = `${ev.clientX}px`
              void expand(menu).then(() => {
                menu.style.opacity = '1'
              })
            }
          })
        }}
      >
        <Paper className="menuItems" ref={menuRef} elevation={3}>
          {items.map((itemProps) => (
            <MenuItem {...itemProps} />
          ))}
        </Paper>
        {children}
      </div>
    )
  },
})
