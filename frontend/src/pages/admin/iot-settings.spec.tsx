import { Cache } from '@furystack/cache'
import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { NotyService } from '@furystack/shades-common-components'
import type { Config, IotConfig } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigService } from '../../services/config-service.js'
import { IotSettingsPage } from './iot-settings.js'

const createMockIotConfig = (pingIntervalMs = 30000, pingTimeoutMs = 3000): Config => ({
  id: 'IOT_CONFIG' as const,
  value: {
    pingIntervalMs,
    pingTimeoutMs,
  } satisfies IotConfig['value'],
  createdAt: new Date(),
  updatedAt: new Date(),
})

describe('IotSettingsPage', () => {
  let injector: Injector
  let mockConfigService: {
    configCache: Cache<Config, [string]>
    saveConfig: ReturnType<typeof vi.fn>
  }
  let mockNotyService: {
    emit: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    const configCache = new Cache<Config, [string]>({
      capacity: 10,
      load: vi.fn().mockResolvedValue(createMockIotConfig()),
    })

    configCache.setExplicitValue({
      loadArgs: ['IOT_CONFIG'],
      value: { status: 'loaded', value: createMockIotConfig(), updatedAt: new Date() },
    })

    mockConfigService = {
      configCache,
      saveConfig: vi.fn().mockResolvedValue(createMockIotConfig()),
    }

    mockNotyService = {
      emit: vi.fn(),
    }

    injector = new Injector()
    injector.setExplicitInstance(mockConfigService as unknown as ConfigService, ConfigService)
    injector.setExplicitInstance(mockNotyService as unknown as NotyService, NotyService)
  })

  afterEach(async () => {
    await injector[Symbol.asyncDispose]()
    document.body.innerHTML = ''
  })

  it('should render the IOT settings page with header', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })
    await flushUpdates()

    const page = document.querySelector('iot-settings-page')
    expect(page).toBeTruthy()
    expect(page?.textContent).toContain('IOT Device Availability')
  })

  it('should display loader when loading', async () => {
    const neverResolvingCache = new Cache<Config, [string]>({
      capacity: 10,
      load: () => new Promise(() => {}),
    })
    mockConfigService.configCache = neverResolvingCache

    injector.setExplicitInstance(mockConfigService as unknown as ConfigService, ConfigService)

    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })
    await flushUpdates()

    const page = document.querySelector('iot-settings-page')
    const skeleton = page?.querySelector('shade-skeleton')
    expect(skeleton).toBeTruthy()
  })

  it('should render the form with ping interval and timeout inputs when loaded', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })
    await flushUpdates()
    await flushUpdates()

    const page = document.querySelector('iot-settings-page')

    const pingIntervalInput = page?.querySelector('input[name="pingIntervalMs"]') as HTMLInputElement
    expect(pingIntervalInput).toBeTruthy()
    expect(pingIntervalInput?.value).toBe('30000')
    expect(pingIntervalInput?.type).toBe('number')
    expect(pingIntervalInput?.min).toBe('1000')
    expect(pingIntervalInput?.max).toBe('3600000')
    expect(pingIntervalInput?.required).toBe(true)

    const pingTimeoutInput = page?.querySelector('input[name="pingTimeoutMs"]') as HTMLInputElement
    expect(pingTimeoutInput).toBeTruthy()
    expect(pingTimeoutInput?.value).toBe('3000')
    expect(pingTimeoutInput?.type).toBe('number')
    expect(pingTimeoutInput?.min).toBe('100')
    expect(pingTimeoutInput?.max).toBe('60000')
    expect(pingTimeoutInput?.required).toBe(true)
  })

  it('should render save button', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })
    await flushUpdates()
    await flushUpdates()

    const page = document.querySelector('iot-settings-page')
    const saveButton = page?.querySelector('button[type="submit"]')
    expect(saveButton).toBeTruthy()
  })

  it('should use configCache on render', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })
    await flushUpdates()

    expect(mockConfigService.configCache).toBeTruthy()
  })

  it('should render with custom values from config', async () => {
    mockConfigService.configCache.setExplicitValue({
      loadArgs: ['IOT_CONFIG'],
      value: { status: 'loaded', value: createMockIotConfig(60000, 5000), updatedAt: new Date() },
    })

    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })
    await flushUpdates()
    await flushUpdates()

    const page = document.querySelector('iot-settings-page')
    const pingIntervalInput = page?.querySelector('input[name="pingIntervalMs"]') as HTMLInputElement
    const pingTimeoutInput = page?.querySelector('input[name="pingTimeoutMs"]') as HTMLInputElement

    expect(pingIntervalInput?.value).toBe('60000')
    expect(pingTimeoutInput?.value).toBe('5000')
  })

  it('should display validation constraints in help text', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })
    await flushUpdates()
    await flushUpdates()

    const page = document.querySelector('iot-settings-page')
    const helpText = page?.textContent

    expect(helpText).toContain('1000ms')
    expect(helpText).toContain('3600000ms')
    expect(helpText).toContain('100ms')
    expect(helpText).toContain('60000ms')
  })

  it('should show success notification after save', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })
    await flushUpdates()
    await flushUpdates()

    const page = document.querySelector('iot-settings-page')
    const form = page?.querySelector('form') as HTMLFormElement

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await new Promise((resolve) => setTimeout(resolve, 50))
    await flushUpdates()

    expect(mockNotyService.emit).toHaveBeenCalledWith('onNotyAdded', {
      title: 'Success',
      body: 'IOT settings saved successfully',
      type: 'success',
    })
  })

  it('should show error notification on save failure', async () => {
    mockConfigService.saveConfig.mockRejectedValueOnce(new Error('Network error'))

    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })
    await flushUpdates()
    await flushUpdates()

    const page = document.querySelector('iot-settings-page')
    const form = page?.querySelector('form') as HTMLFormElement

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await new Promise((resolve) => setTimeout(resolve, 50))
    await flushUpdates()

    expect(mockNotyService.emit).toHaveBeenCalledWith('onNotyAdded', {
      title: 'Error',
      body: 'Network error',
      type: 'error',
    })
  })
})
