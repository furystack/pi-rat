import { createComponent, Shade } from '@furystack/shades'
import { Paper, expand, collapse } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { Icon as IconModel } from 'common'
import { Icon } from './Icon.js'

type MenuItemProps = {
  icon: IconModel
  label: string
  onClick: () => void
}

const MenuItem = Shade<MenuItemProps>({
  shadowDomName: 'shade-app-menu-item',
  render: ({ props }) => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '8px',
          cursor: 'pointer',
        }}
        onmouseenter={(ev) => {
          ;(ev.target as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.1)'
        }}
        onmouseleave={(ev) => {
          ;(ev.target as HTMLElement).style.backgroundColor = 'transparent'
        }}
        onclick={props.onClick}>
        <div
          style={{
            minWidth: '24px',
            paddingRight: '8px',
            textAlign: 'center',
            lineHeight: '100%',
          }}>
          <Icon {...props.icon} />
        </div>
        <div style={{ lineHeight: '100%' }}>{props.label}</div>
      </div>
    )
  },
})

type ContextMenuProps = {
  items: MenuItemProps[]
}

export const ContextMenu = Shade<ContextMenuProps>({
  shadowDomName: 'shade-app-context-menu',
  constructed: ({ useDisposable }) => {
    const isOpen = useDisposable('isOpen', () => new ObservableValue(false))

    const listener = (_ev: MouseEvent) => {
      isOpen.setValue(false)
    }

    window.addEventListener('click', listener)
    window.addEventListener('contextmenu', listener)

    return () => {
      window.removeEventListener('click', listener)
      window.removeEventListener('contextmenu', listener)
    }
  },
  render: ({ props, useDisposable, children, element }) => {
    const { items } = props

    const isOpen = useDisposable('isOpen', () => new ObservableValue(false))

    isOpen.subscribe(async (value) => {
      const menu = element.querySelector('.menuItems') as HTMLUListElement
      try {
        if (value) {
          menu.getAnimations().forEach((a) => a.cancel())
          menu.style.display = 'block'
          await expand(menu)
          menu.style.opacity = '1'
        } else {
          menu.getAnimations().forEach((a) => a.cancel())
          await collapse(menu)
          menu.style.display = 'none'
          menu.style.opacity = '0'
        }
      } catch (error) {
        /** in-progress animations will throw */
      }
    })

    return (
      <div
        oncontextmenu={(ev) => {
          ev.preventDefault()
          setTimeout(() => {
            const menu = element.querySelector('.menuItems') as HTMLUListElement
            menu.style.display = 'block'
            menu.style.top = `${ev.clientY}px`
            menu.style.left = `${ev.clientX}px`
            isOpen.setValue(true)
          })
        }}>
        <Paper
          className="menuItems"
          elevation={3}
          style={{
            display: 'none',
            opacity: '0',
            position: 'fixed',
            zIndex: '1',
            margin: '0',
            padding: '0',
            background: 'rgba(0,0,0,0.07)',
            backdropFilter: 'blur(20px)',
          }}>
          {items.map((itemProps) => (
            <MenuItem {...itemProps} />
          ))}
        </Paper>
        {children}
      </div>
    )
  },
})
