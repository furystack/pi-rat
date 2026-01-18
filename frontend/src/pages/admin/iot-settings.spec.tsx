import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { NotyService } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
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

type CacheState<T> =
  | { status: 'uninitialized' }
  | { status: 'loading' }
  | { status: 'loaded'; value: T; updatedAt: Date }
  | { status: 'error'; error: unknown; updatedAt: Date }

describe('IotSettingsPage', () => {
  let injector: Injector
  let mockConfigService: {
    getConfigAsObservable: ReturnType<typeof vi.fn>
    saveConfig: ReturnType<typeof vi.fn>
  }
  let mockNotyService: {
    emit: ReturnType<typeof vi.fn>
  }
  let configObservable: ObservableValue<CacheState<Config>>

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    configObservable = new ObservableValue<CacheState<Config>>({
      status: 'loaded',
      value: createMockIotConfig(),
      updatedAt: new Date(),
    })

    mockConfigService = {
      getConfigAsObservable: vi.fn().mockReturnValue(configObservable),
      saveConfig: vi.fn().mockResolvedValue(createMockIotConfig()),
    }

    mockNotyService = {
      emit: vi.fn(),
    }

    injector = new Injector()
    injector.setExplicitInstance(mockConfigService as unknown as ConfigService, ConfigService)
    injector.setExplicitInstance(mockNotyService as unknown as NotyService, NotyService)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render the IOT settings page with header', () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })

    const page = document.querySelector('iot-settings-page')
    expect(page).toBeTruthy()
    expect(page?.textContent).toContain('IOT Device Availability')
  })

  it('should display loading state', () => {
    configObservable.setValue({ status: 'loading' })

    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })

    const page = document.querySelector('iot-settings-page')
    expect(page?.textContent).toContain('Loading settings...')
  })

  it('should render the form with ping interval and timeout inputs when loaded', () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })

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

  it('should render save button', () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })

    const page = document.querySelector('iot-settings-page')
    const saveButton = page?.querySelector('button[type="submit"]')
    expect(saveButton).toBeTruthy()
    expect(saveButton?.textContent).toContain('Save Settings')
  })

  it('should use default values when config is not loaded', () => {
    configObservable.setValue({
      status: 'loaded',
      value: { id: 'IOT_CONFIG', value: null, createdAt: new Date(), updatedAt: new Date() } as unknown as Config,
      updatedAt: new Date(),
    })

    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })

    const page = document.querySelector('iot-settings-page')
    const pingIntervalInput = page?.querySelector('input[name="pingIntervalMs"]') as HTMLInputElement
    const pingTimeoutInput = page?.querySelector('input[name="pingTimeoutMs"]') as HTMLInputElement

    expect(pingIntervalInput?.value).toBe('30000')
    expect(pingTimeoutInput?.value).toBe('3000')
  })

  it('should show validation error when ping interval is below minimum', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })

    const page = document.querySelector('iot-settings-page')
    const pingIntervalInput = page?.querySelector('input[name="pingIntervalMs"]') as HTMLInputElement
    const form = page?.querySelector('form') as HTMLFormElement

    pingIntervalInput.value = '500'
    pingIntervalInput.dispatchEvent(new Event('input', { bubbles: true }))

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await new Promise((resolve) => setTimeout(resolve, 50))

    const validationError = page?.querySelector('[data-testid="validation-error"]')
    expect(validationError?.textContent).toContain('Ping interval must be at least 1000ms')
  })

  it('should show validation error when ping interval exceeds maximum', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })

    const page = document.querySelector('iot-settings-page')
    const pingIntervalInput = page?.querySelector('input[name="pingIntervalMs"]') as HTMLInputElement
    const form = page?.querySelector('form') as HTMLFormElement

    pingIntervalInput.value = '5000000'
    pingIntervalInput.dispatchEvent(new Event('input', { bubbles: true }))

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await new Promise((resolve) => setTimeout(resolve, 50))

    const validationError = page?.querySelector('[data-testid="validation-error"]')
    expect(validationError?.textContent).toContain('Ping interval must be at most 3600000ms')
  })

  it('should show validation error when ping timeout is below minimum', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })

    const page = document.querySelector('iot-settings-page')
    const pingTimeoutInput = page?.querySelector('input[name="pingTimeoutMs"]') as HTMLInputElement
    const form = page?.querySelector('form') as HTMLFormElement

    pingTimeoutInput.value = '50'
    pingTimeoutInput.dispatchEvent(new Event('input', { bubbles: true }))

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await new Promise((resolve) => setTimeout(resolve, 50))

    const validationError = page?.querySelector('[data-testid="validation-error"]')
    expect(validationError?.textContent).toContain('Ping timeout must be at least 100ms')
  })

  it('should show validation error when ping timeout exceeds maximum', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })

    const page = document.querySelector('iot-settings-page')
    const pingTimeoutInput = page?.querySelector('input[name="pingTimeoutMs"]') as HTMLInputElement
    const form = page?.querySelector('form') as HTMLFormElement

    pingTimeoutInput.value = '100000'
    pingTimeoutInput.dispatchEvent(new Event('input', { bubbles: true }))

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await new Promise((resolve) => setTimeout(resolve, 50))

    const validationError = page?.querySelector('[data-testid="validation-error"]')
    expect(validationError?.textContent).toContain('Ping timeout must be at most 60000ms')
  })

  it('should show validation error when ping timeout is greater than or equal to ping interval', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })

    const page = document.querySelector('iot-settings-page')
    const pingIntervalInput = page?.querySelector('input[name="pingIntervalMs"]') as HTMLInputElement
    const pingTimeoutInput = page?.querySelector('input[name="pingTimeoutMs"]') as HTMLInputElement
    const form = page?.querySelector('form') as HTMLFormElement

    pingIntervalInput.value = '5000'
    pingIntervalInput.dispatchEvent(new Event('input', { bubbles: true }))
    pingTimeoutInput.value = '5000'
    pingTimeoutInput.dispatchEvent(new Event('input', { bubbles: true }))

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await new Promise((resolve) => setTimeout(resolve, 50))

    const validationError = page?.querySelector('[data-testid="validation-error"]')
    expect(validationError?.textContent).toContain('Ping timeout must be less than ping interval')
  })

  it('should save valid configuration', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })

    const page = document.querySelector('iot-settings-page')
    const pingIntervalInput = page?.querySelector('input[name="pingIntervalMs"]') as HTMLInputElement
    const pingTimeoutInput = page?.querySelector('input[name="pingTimeoutMs"]') as HTMLInputElement
    const form = page?.querySelector('form') as HTMLFormElement

    pingIntervalInput.value = '60000'
    pingIntervalInput.dispatchEvent(new Event('input', { bubbles: true }))
    pingTimeoutInput.value = '5000'
    pingTimeoutInput.dispatchEvent(new Event('input', { bubbles: true }))

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockConfigService.saveConfig).toHaveBeenCalledWith('IOT_CONFIG', {
      pingIntervalMs: 60000,
      pingTimeoutMs: 5000,
    })
  })

  it('should show success notification after save', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <IotSettingsPage />,
    })

    const page = document.querySelector('iot-settings-page')
    const form = page?.querySelector('form') as HTMLFormElement

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await new Promise((resolve) => setTimeout(resolve, 50))

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

    const page = document.querySelector('iot-settings-page')
    const form = page?.querySelector('form') as HTMLFormElement

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockNotyService.emit).toHaveBeenCalledWith('onNotyAdded', {
      title: 'Error',
      body: 'Network error',
      type: 'error',
    })
  })
})
