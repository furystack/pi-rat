import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot, LocationService } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { SettingsMenuItem } from './settings-menu-item.js'

describe('SettingsMenuItem', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render with icon, label, and href', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      history.pushState(null, '', '/other')
      injector.getInstance(LocationService).updateState()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <SettingsMenuItem icon="🏠" label="Home" href="/home" />,
      })

      const menuItem = document.querySelector('settings-menu-item')
      expect(menuItem).toBeTruthy()

      const link = menuItem?.querySelector('a')
      expect(link).toBeTruthy()
      expect(link?.getAttribute('href')).toBe('/home')
      expect(link?.textContent).toContain('Home')
      expect(link?.textContent).toContain('🏠')
    })
  })

  it('should render with active state when URL matches href', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      history.pushState(null, '', '/settings')
      injector.getInstance(LocationService).updateState()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <SettingsMenuItem icon="⚙️" label="Settings" href="/settings" />,
      })

      const menuItem = document.querySelector('settings-menu-item')
      expect(menuItem).toBeTruthy()

      const link = menuItem?.querySelector('a')
      expect(link).toBeTruthy()
      expect(link?.getAttribute('href')).toBe('/settings')
      expect(link?.textContent).toContain('Settings')
    })
  })

  it('should render with inactive state when URL does not match href', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      history.pushState(null, '', '/other-page')
      injector.getInstance(LocationService).updateState()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <SettingsMenuItem icon="📁" label="Files" href="/files" />,
      })

      const menuItem = document.querySelector('settings-menu-item')
      expect(menuItem).toBeTruthy()

      const link = menuItem?.querySelector('a')
      expect(link).toBeTruthy()
      expect(link?.getAttribute('href')).toBe('/files')
    })
  })

  it('should render correctly with different URLs', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      history.pushState(null, '', '/something-else')
      injector.getInstance(LocationService).updateState()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <SettingsMenuItem icon="🎬" label="Movies" href="/movies" />,
      })

      const menuItem = document.querySelector('settings-menu-item')
      expect(menuItem).toBeTruthy()

      const link = menuItem?.querySelector('a')
      expect(link).toBeTruthy()
      expect(link?.getAttribute('href')).toBe('/movies')
      expect(link?.textContent).toContain('Movies')
    })
  })
})
