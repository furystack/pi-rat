import { Injector } from '@furystack/inject'
import { ScreenService, createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { ObservableValue, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { WizardStep } from './wizard-step.js'

const createMockScreenService = (isLargeScreen = true) => {
  return {
    screenSize: {
      atLeast: {
        xs: new ObservableValue(true),
        sm: new ObservableValue(true),
        md: new ObservableValue(isLargeScreen),
        lg: new ObservableValue(isLargeScreen),
        xl: new ObservableValue(false),
      },
    },
  } as unknown as ScreenService
}

/**
 * Gets the wizard navigation buttons from the .actions container.
 * Asserts that exactly 2 buttons exist (Previous and Next/Finish).
 * Returns them by their semantic role based on the type attribute.
 */
const getWizardNavigationButtons = (wizardStep: Element) => {
  const actionsContainer = wizardStep.querySelector('.actions')
  expect(actionsContainer).toBeTruthy()

  const buttons = actionsContainer?.querySelectorAll('button')
  expect(buttons?.length).toBe(2)

  const previousButton = actionsContainer?.querySelector('button:not([type="submit"])') as HTMLButtonElement
  const nextOrFinishButton = actionsContainer?.querySelector('button[type="submit"]') as HTMLButtonElement

  return { previousButton, nextOrFinishButton }
}

describe('WizardStep', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    // Mock animate for jsdom
    HTMLElement.prototype.animate = vi.fn().mockReturnValue({
      finished: Promise.resolve(),
      cancel: vi.fn(),
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('should render with title', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ScreenService, () => createMockScreenService())
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <WizardStep title="Test Step" currentPage={0} maxPages={3}>
            <p>Step content</p>
          </WizardStep>
        ),
      })
      await flushUpdates()

      const wizardStep = document.querySelector('wizard-step')
      expect(wizardStep).toBeTruthy()

      expect(wizardStep?.textContent).toContain('Test Step')
    })
  })

  it('should render children in content area', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ScreenService, () => createMockScreenService())
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <WizardStep title="Content Test" currentPage={0} maxPages={2}>
            <div id="test-content">Custom content here</div>
          </WizardStep>
        ),
      })
      await flushUpdates()

      const wizardStep = document.querySelector('wizard-step')
      expect(wizardStep).toBeTruthy()

      const content = wizardStep?.querySelector('#test-content')
      expect(content).toBeTruthy()
      expect(content?.textContent).toBe('Custom content here')
    })
  })

  it('should disable Previous button on first page', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ScreenService, () => createMockScreenService())
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <WizardStep title="First Page" currentPage={0} maxPages={3}>
            Content
          </WizardStep>
        ),
      })
      await flushUpdates()

      vi.runAllTimers()

      const wizardStep = document.querySelector('wizard-step') as Element
      const { previousButton } = getWizardNavigationButtons(wizardStep)

      expect(previousButton.disabled).toBe(true)
    })
  })

  it('should enable Previous button when not on first page', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ScreenService, () => createMockScreenService())
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <WizardStep title="Second Page" currentPage={1} maxPages={3}>
            Content
          </WizardStep>
        ),
      })
      await flushUpdates()

      vi.runAllTimers()

      const wizardStep = document.querySelector('wizard-step') as Element
      const { previousButton } = getWizardNavigationButtons(wizardStep)

      expect(previousButton.disabled).toBe(false)
    })
  })

  it('should render Next/Finish button that is enabled when not on last page', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ScreenService, () => createMockScreenService())
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <WizardStep title="Middle Page" currentPage={1} maxPages={3}>
            Content
          </WizardStep>
        ),
      })
      await flushUpdates()

      vi.runAllTimers()

      const wizardStep = document.querySelector('wizard-step') as Element
      const { nextOrFinishButton } = getWizardNavigationButtons(wizardStep)

      expect(nextOrFinishButton.disabled).toBe(false)
    })
  })

  it('should render Next/Finish button on last page', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ScreenService, () => createMockScreenService())
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <WizardStep title="Last Page" currentPage={2} maxPages={3}>
            Content
          </WizardStep>
        ),
      })
      await flushUpdates()

      vi.runAllTimers()

      const wizardStep = document.querySelector('wizard-step') as Element
      const { nextOrFinishButton } = getWizardNavigationButtons(wizardStep)

      expect(nextOrFinishButton.getAttribute('type')).toBe('submit')
    })
  })

  it('should call onPrev when Previous button is clicked', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ScreenService, () => createMockScreenService())
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onPrev = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <WizardStep title="Prev Test" currentPage={1} maxPages={3} onPrev={onPrev}>
            Content
          </WizardStep>
        ),
      })
      await flushUpdates()

      vi.runAllTimers()

      const wizardStep = document.querySelector('wizard-step') as Element
      const { previousButton } = getWizardNavigationButtons(wizardStep)

      previousButton.click()
      expect(onPrev).toHaveBeenCalledTimes(1)
    })
  })

  it('should call onNext on form submit when no onSubmit provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ScreenService, () => createMockScreenService())
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onNext = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <WizardStep title="Next Test" currentPage={0} maxPages={3} onNext={onNext}>
            Content
          </WizardStep>
        ),
      })
      await flushUpdates()

      const wizardStep = document.querySelector('wizard-step')
      const form = wizardStep?.querySelector('form')

      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await flushUpdates()
      expect(onNext).toHaveBeenCalledTimes(1)
    })
  })

  it('should call onSubmit on form submit when provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(ScreenService, () => createMockScreenService())
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSubmit = vi.fn()
      const onNext = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <WizardStep
            title="Submit Test"
            currentPage={0}
            maxPages={3}
            validate={(data): data is Record<string, string> => typeof data === 'object' && data !== null}
            onSubmit={onSubmit}
            onNext={onNext}
          >
            Content
          </WizardStep>
        ),
      })
      await flushUpdates()

      const wizardStep = document.querySelector('wizard-step')
      const form = wizardStep?.querySelector('form')

      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await flushUpdates()
      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onNext).not.toHaveBeenCalled()
    })
  })
})
