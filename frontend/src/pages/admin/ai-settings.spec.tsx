import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { NotyService } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { Config, OllamaConfig } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigService } from '../../services/config-service.js'
import { AiSettingsPage } from './ai-settings.js'

const createMockOllamaConfig = (host = 'http://localhost:11434'): Config => ({
  id: 'OLLAMA_CONFIG' as const,
  value: {
    host,
  } satisfies OllamaConfig['value'],
  createdAt: new Date(),
  updatedAt: new Date(),
})

type CacheState<T> =
  | { status: 'uninitialized' }
  | { status: 'loading' }
  | { status: 'loaded'; value: T; updatedAt: Date }
  | { status: 'error'; error: unknown; updatedAt: Date }

describe('AiSettingsPage', () => {
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
      value: createMockOllamaConfig(),
      updatedAt: new Date(),
    })

    mockConfigService = {
      getConfigAsObservable: vi.fn().mockReturnValue(configObservable),
      saveConfig: vi.fn().mockResolvedValue(createMockOllamaConfig()),
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

  it('should render the AI settings page with header', () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })

    const page = document.querySelector('ai-settings-page')
    expect(page).toBeTruthy()
    expect(page?.textContent).toContain('Ollama Integration')
  })

  it('should display loading state', () => {
    configObservable.setValue({ status: 'loading' })

    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })

    const page = document.querySelector('ai-settings-page')
    expect(page?.textContent).toContain('Loading settings...')
  })

  it('should render the form with host input when loaded', () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })

    const page = document.querySelector('ai-settings-page')
    const hostInput = page?.querySelector('input[name="host"]') as HTMLInputElement
    expect(hostInput).toBeTruthy()
    expect(hostInput?.value).toBe('http://localhost:11434')
    expect(hostInput?.type).toBe('url')
  })

  it('should render save button', () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })

    const page = document.querySelector('ai-settings-page')
    const saveButton = page?.querySelector('button[type="submit"]')
    expect(saveButton).toBeTruthy()
    expect(saveButton?.textContent).toContain('Save Settings')
  })

  it('should use default values when config is not loaded', () => {
    configObservable.setValue({
      status: 'loaded',
      value: { id: 'OLLAMA_CONFIG', value: null, createdAt: new Date(), updatedAt: new Date() } as unknown as Config,
      updatedAt: new Date(),
    })

    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })

    const page = document.querySelector('ai-settings-page')
    const hostInput = page?.querySelector('input[name="host"]') as HTMLInputElement
    expect(hostInput?.value).toBe('')
  })

  it('should show validation error for invalid URL', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })

    const page = document.querySelector('ai-settings-page')
    const hostInput = page?.querySelector('input[name="host"]') as HTMLInputElement
    const form = page?.querySelector('form') as HTMLFormElement

    hostInput.value = 'not-a-valid-url'
    hostInput.dispatchEvent(new Event('input', { bubbles: true }))

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await new Promise((resolve) => setTimeout(resolve, 50))

    const validationError = page?.querySelector('[data-testid="validation-error"]')
    expect(validationError?.textContent).toContain('Please enter a valid URL')
  })

  it('should accept empty host URL', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })

    const page = document.querySelector('ai-settings-page')
    const hostInput = page?.querySelector('input[name="host"]') as HTMLInputElement
    const form = page?.querySelector('form') as HTMLFormElement

    hostInput.value = ''
    hostInput.dispatchEvent(new Event('input', { bubbles: true }))

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockConfigService.saveConfig).toHaveBeenCalledWith('OLLAMA_CONFIG', { host: '' })
  })

  it('should accept valid HTTP URL', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })

    const page = document.querySelector('ai-settings-page')
    const hostInput = page?.querySelector('input[name="host"]') as HTMLInputElement
    const form = page?.querySelector('form') as HTMLFormElement

    hostInput.value = 'http://my-server:8080'
    hostInput.dispatchEvent(new Event('input', { bubbles: true }))

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockConfigService.saveConfig).toHaveBeenCalledWith('OLLAMA_CONFIG', { host: 'http://my-server:8080' })
  })

  it('should accept valid HTTPS URL', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })

    const page = document.querySelector('ai-settings-page')
    const hostInput = page?.querySelector('input[name="host"]') as HTMLInputElement
    const form = page?.querySelector('form') as HTMLFormElement

    hostInput.value = 'https://secure-server.com'
    hostInput.dispatchEvent(new Event('input', { bubbles: true }))

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockConfigService.saveConfig).toHaveBeenCalledWith('OLLAMA_CONFIG', { host: 'https://secure-server.com' })
  })

  it('should show success notification after save', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })

    const page = document.querySelector('ai-settings-page')
    const form = page?.querySelector('form') as HTMLFormElement

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockNotyService.emit).toHaveBeenCalledWith('onNotyAdded', {
      title: 'Success',
      body: 'AI settings saved successfully',
      type: 'success',
    })
  })

  it('should show error notification on save failure', async () => {
    mockConfigService.saveConfig.mockRejectedValueOnce(new Error('Network error'))

    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })

    const page = document.querySelector('ai-settings-page')
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
