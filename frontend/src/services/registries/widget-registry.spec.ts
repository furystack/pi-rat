import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { WidgetRegistry } from './widget-registry.js'

describe('WidgetRegistry', () => {
  it('should register and retrieve a widget renderer', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(WidgetRegistry)
      const renderer = vi.fn()

      registry.registerWidget('html', renderer)

      expect(registry.getRenderer('html')).toBe(renderer)
    })
  })

  it('should return undefined for unregistered widget type', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(WidgetRegistry)

      expect(registry.getRenderer('html')).toBeUndefined()
    })
  })

  it('should warn and overwrite when registering a duplicate type', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(WidgetRegistry)
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const renderer1 = vi.fn()
      const renderer2 = vi.fn()

      registry.registerWidget('html', renderer1)
      registry.registerWidget('html', renderer2)

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("'html'"))
      expect(registry.getRenderer('html')).toBe(renderer2)

      warnSpy.mockRestore()
    })
  })

  it('should register and retrieve a plugin widget renderer', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(WidgetRegistry)
      const renderer = vi.fn()

      registry.registerPluginWidget<{ type: 'custom-plugin-widget'; data: string }>('custom-plugin-widget', renderer)

      expect(registry.getRenderer('custom-plugin-widget')).toBe(renderer)
    })
  })
})
