import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { SettingsMenuItem } from './settings-menu-item.js'

describe('SettingsMenuItem', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render with icon, label, and href', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <SettingsMenuItem icon={<span>🏠</span>} label="Home" href="/home" />,
    })

    const menuItem = document.querySelector('settings-menu-item')
    expect(menuItem).toBeTruthy()

    const link = menuItem?.querySelector('a')
    expect(link).toBeTruthy()
    expect(link?.getAttribute('href')).toBe('/home')
    expect(link?.textContent).toContain('Home')
    expect(link?.textContent).toContain('🏠')
  })

  it('should render with active state styling', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <SettingsMenuItem icon={<span>⚙️</span>} label="Settings" href="/settings" isActive={true} />,
    })

    const menuItem = document.querySelector('settings-menu-item')
    expect(menuItem).toBeTruthy()

    const link = menuItem?.querySelector('a')
    expect(link).toBeTruthy()
    expect(link?.getAttribute('href')).toBe('/settings')
    expect(link?.textContent).toContain('Settings')
  })

  it('should render with inactive state by default', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <SettingsMenuItem icon={<span>📁</span>} label="Files" href="/files" />,
    })

    const menuItem = document.querySelector('settings-menu-item')
    expect(menuItem).toBeTruthy()

    const link = menuItem?.querySelector('a')
    expect(link).toBeTruthy()
    expect(link?.getAttribute('href')).toBe('/files')
  })

  it('should render with explicit inactive state', () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <SettingsMenuItem icon={<span>🎬</span>} label="Movies" href="/movies" isActive={false} />,
    })

    const menuItem = document.querySelector('settings-menu-item')
    expect(menuItem).toBeTruthy()

    const link = menuItem?.querySelector('a')
    expect(link).toBeTruthy()
    expect(link?.getAttribute('href')).toBe('/movies')
    expect(link?.textContent).toContain('Movies')
  })
})
