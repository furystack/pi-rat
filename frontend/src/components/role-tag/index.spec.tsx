import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RoleTag } from './index.js'

describe('RoleTag', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('rendering', () => {
    it('should render with role display name', () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RoleTag roleName="admin" variant="default" />,
      })

      const roleTag = document.querySelector('role-tag')
      expect(roleTag).toBeTruthy()
      expect(roleTag?.textContent).toContain('Application Admin')
    })

    it('should render media-manager role with correct display name', () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RoleTag roleName="media-manager" variant="default" />,
      })

      const roleTag = document.querySelector('role-tag')
      expect(roleTag?.textContent).toContain('Media Manager')
    })

    it('should render viewer role with correct display name', () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RoleTag roleName="viewer" variant="default" />,
      })

      const roleTag = document.querySelector('role-tag')
      expect(roleTag?.textContent).toContain('Viewer')
    })

    it('should render iot-manager role with correct display name', () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RoleTag roleName="iot-manager" variant="default" />,
      })

      const roleTag = document.querySelector('role-tag')
      expect(roleTag?.textContent).toContain('IoT Manager')
    })

    it('should have title attribute with role description', () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RoleTag roleName="admin" variant="default" />,
      })

      const roleTag = document.querySelector('role-tag')
      const span = roleTag?.querySelector('span')
      expect(span?.getAttribute('title')).toBe('Full system access including user management and all settings')
    })
  })

  describe('variants', () => {
    it('should render default variant without remove or restore buttons when no handlers provided', () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RoleTag roleName="admin" variant="default" />,
      })

      const roleTag = document.querySelector('role-tag')
      const buttons = roleTag?.querySelectorAll('button')
      expect(buttons?.length).toBe(0)
    })

    it('should render default variant with remove button when onRemove is provided', () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onRemove = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RoleTag roleName="admin" variant="default" onRemove={onRemove} />,
      })

      const roleTag = document.querySelector('role-tag')
      const removeButton = roleTag?.querySelector('button')
      expect(removeButton).toBeTruthy()
      expect(removeButton?.textContent).toContain('×')
      expect(removeButton?.getAttribute('title')).toBe('Remove role')
    })

    it('should render added variant with remove button', () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onRemove = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RoleTag roleName="viewer" variant="added" onRemove={onRemove} />,
      })

      const roleTag = document.querySelector('role-tag')
      const removeButton = roleTag?.querySelector('button')
      expect(removeButton).toBeTruthy()
      expect(removeButton?.textContent).toContain('×')
    })

    it('should render removed variant with restore button', () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onRestore = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RoleTag roleName="admin" variant="removed" onRestore={onRestore} />,
      })

      const roleTag = document.querySelector('role-tag')
      const restoreButton = roleTag?.querySelector('button')
      expect(restoreButton).toBeTruthy()
      expect(restoreButton?.textContent).toContain('↩')
      expect(restoreButton?.getAttribute('title')).toBe('Restore role')
    })

    it('should not render remove button for removed variant', () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onRemove = vi.fn()
      const onRestore = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RoleTag roleName="admin" variant="removed" onRemove={onRemove} onRestore={onRestore} />,
      })

      const roleTag = document.querySelector('role-tag')
      const buttons = roleTag?.querySelectorAll('button')
      // Should only have restore button, not remove button
      expect(buttons?.length).toBe(1)
      expect(buttons?.[0]?.textContent).toContain('↩')
    })
  })

  describe('interactions', () => {
    it('should call onRemove when remove button is clicked', () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onRemove = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RoleTag roleName="admin" variant="default" onRemove={onRemove} />,
      })

      const roleTag = document.querySelector('role-tag')
      const removeButton = roleTag?.querySelector('button') as HTMLButtonElement
      removeButton.click()

      expect(onRemove).toHaveBeenCalledTimes(1)
    })

    it('should call onRestore when restore button is clicked', () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onRestore = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <RoleTag roleName="admin" variant="removed" onRestore={onRestore} />,
      })

      const roleTag = document.querySelector('role-tag')
      const restoreButton = roleTag?.querySelector('button') as HTMLButtonElement
      restoreButton.click()

      expect(onRestore).toHaveBeenCalledTimes(1)
    })

    it('should stop event propagation when remove button is clicked', () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onRemove = vi.fn()
      const parentClick = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <div onclick={parentClick}>
            <RoleTag roleName="admin" variant="default" onRemove={onRemove} />
          </div>
        ),
      })

      const roleTag = document.querySelector('role-tag')
      const removeButton = roleTag?.querySelector('button') as HTMLButtonElement
      removeButton.click()

      expect(onRemove).toHaveBeenCalledTimes(1)
      expect(parentClick).not.toHaveBeenCalled()
    })

    it('should stop event propagation when restore button is clicked', () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onRestore = vi.fn()
      const parentClick = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <div onclick={parentClick}>
            <RoleTag roleName="admin" variant="removed" onRestore={onRestore} />
          </div>
        ),
      })

      const roleTag = document.querySelector('role-tag')
      const restoreButton = roleTag?.querySelector('button') as HTMLButtonElement
      restoreButton.click()

      expect(onRestore).toHaveBeenCalledTimes(1)
      expect(parentClick).not.toHaveBeenCalled()
    })
  })
})
