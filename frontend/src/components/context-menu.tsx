import { createComponent, Shade } from '@furystack/shades'
import { ClickAwayService, Paper, expand, collapse } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'

type ContextMenuProps = {
  content: JSX.Element
}

export const ContextMenu = Shade<ContextMenuProps>({
  shadowDomName: 'shade-app-context-menu',
  constructed: ({ element, useDisposable }) => {
    const isOpen = useDisposable('isOpen', () => new ObservableValue(false))

    useDisposable(
      'clickAway',
      () =>
        new ClickAwayService(element.querySelector('.menuItems') as HTMLElement, () => {
          isOpen.setValue(false)
        }),
    )
  },
  render: ({ props, useDisposable, children, element }) => {
    const { content } = props

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
          const menu = element.querySelector('.menuItems') as HTMLUListElement
          menu.style.display = 'block'
          menu.style.top = `${ev.clientY}px`
          menu.style.left = `${ev.clientX}px`
          isOpen.setValue(true)
        }}>
        <Paper
          className="menuItems"
          elevation={3}
          style={{ display: 'none', opacity: '0', position: 'fixed', zIndex: '1', margin: '0' }}>
          {content}
        </Paper>
        {children}
      </div>
    )
  },
})
