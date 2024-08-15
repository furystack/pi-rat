import { createComponent, ScreenService, Shade } from '@furystack/shades'
import type { WizardStepProps } from '@furystack/shades-common-components'
import { Button, showParallax } from '@furystack/shades-common-components'

export const WizardStep = Shade<
  { title: string; onSubmit?: (ev: SubmitEvent) => void | Promise<void> } & WizardStepProps
>({
  shadowDomName: 'wizard-step',
  render: ({ props, element, children, useObservable, injector }) => {
    setTimeout(() => {
      void showParallax(element.querySelector('h1'))
      void showParallax(element.querySelector('div.content'), { delay: 200, duration: 600 })
      void showParallax(element.querySelector('div.actions'), { delay: 400, duration: 2000 })
    }, 1)

    const updateScreenSize = (isLargeScreen: boolean) => {
      const form = element?.querySelector('form')
      if (form) {
        form.style.padding = '16px'
        form.style.width = isLargeScreen ? '800px' : `${window.innerWidth - 16}px`
        form.style.height = isLargeScreen ? '500px' : `${window.innerHeight - 192}px`
      }
    }

    const [isLargeScreen] = useObservable('screenSize', injector.getInstance(ScreenService).screenSize.atLeast.md, {
      onChange: updateScreenSize,
    })

    updateScreenSize(isLargeScreen)

    return (
      <form
        onsubmit={async (ev) => {
          ev.preventDefault()
          if (props.onSubmit) {
            await props.onSubmit(ev)
          } else {
            props.onNext?.()
          }
        }}
        style={{
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          height: '430px',
          justifyContent: 'space-between',
          maxWidth: 'calc(100% - 32px)',
          maxHeight: 'calc(100% - 32px)',
        }}
      >
        <h1 style={{ opacity: '0' }}>{props.title}</h1>
        <div style={{ opacity: '0', flexShrink: '1', overflow: 'auto', padding: '0 .1em' }} className="content">
          {children}
        </div>
        <div
          className="actions"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
            opacity: '0',
          }}
        >
          <Button onclick={() => props.onPrev?.()} disabled={props.currentPage < 1} variant="outlined">
            Previous
          </Button>
          <Button
            type="submit"
            disabled={props.currentPage > props.maxPages - 1}
            variant="contained"
            color={props.currentPage === props.maxPages - 1 ? 'success' : 'primary'}
          >
            {props.currentPage < props.maxPages - 1 ? 'Next' : 'Finish'}
          </Button>
        </div>
      </form>
    )
  },
})
