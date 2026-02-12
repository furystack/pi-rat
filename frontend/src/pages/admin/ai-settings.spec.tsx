import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
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

  afterEach(async () => {
    await injector[Symbol.asyncDispose]()
    document.body.innerHTML = ''
  })

  it('should render the AI settings page with header', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })
    await flushUpdates()

    const page = document.querySelector('ai-settings-page')
    expect(page).toBeTruthy()
    expect(page?.textContent).toContain('Ollama Integration')
  })

  it('should display loading state', async () => {
    configObservable.setValue({ status: 'loading' })

    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })
    await flushUpdates()

    const page = document.querySelector('ai-settings-page')
    expect(page?.textContent).toContain('Loading settings...')
  })

  it('should render the form with host input when loaded', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })
    await flushUpdates()
    await flushUpdates()

    const page = document.querySelector('ai-settings-page')
    const hostInput = page?.querySelector('input[name="host"]') as HTMLInputElement
    expect(hostInput).toBeTruthy()
    expect(hostInput?.value).toBe('http://localhost:11434')
    expect(hostInput?.type).toBe('url')
  })

  it('should render save button', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })
    await flushUpdates()
    await flushUpdates()

    const page = document.querySelector('ai-settings-page')
    const saveButton = page?.querySelector('button[type="submit"]')
    expect(saveButton).toBeTruthy()
  })

  it('should call ConfigService.getConfigAsObservable on render', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })
    await flushUpdates()

    expect(mockConfigService.getConfigAsObservable).toHaveBeenCalledWith('OLLAMA_CONFIG')
  })

  it('should render with empty host when config value is empty', async () => {
    configObservable.setValue({
      status: 'loaded',
      value: createMockOllamaConfig(''),
      updatedAt: new Date(),
    })

    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })
    await flushUpdates()
    await flushUpdates()

    const page = document.querySelector('ai-settings-page')
    const hostInput = page?.querySelector('input[name="host"]') as HTMLInputElement
    expect(hostInput?.value).toBe('')
  })

  it('should show success notification after save', async () => {
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AiSettingsPage />,
    })
    await flushUpdates()
    await flushUpdates()

    const page = document.querySelector('ai-settings-page')
    const form = page?.querySelector('form') as HTMLFormElement

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await new Promise((resolve) => setTimeout(resolve, 50))
    await flushUpdates()

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
    await flushUpdates()
    await flushUpdates()

    const page = document.querySelector('ai-settings-page')
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
