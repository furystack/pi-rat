import { createComponent, ScreenService, Shade } from '@furystack/shades'
import type { WizardStepProps } from '@furystack/shades-common-components'
import { Button, Form, showParallax } from '@furystack/shades-common-components'

const defaultValidate = (formData: unknown): formData is Record<string, string> =>
  typeof formData === 'object' &&
  formData !== null &&
  Object.values(formData as Record<string, unknown>).every((v) => typeof v === 'string')

export const WizardStep = Shade<
  {
    title: string
    validate?: (formData: unknown) => formData is Record<string, string>
    onSubmit?: (formData: Record<string, string>) => void | Promise<void>
  } & WizardStepProps
>({
  shadowDomName: 'wizard-step',
  css: {
    '& form': {
      padding: '32px',
      display: 'flex',
      flexDirection: 'column',
      height: '430px',
      justifyContent: 'space-between',
      maxWidth: 'calc(100% - 32px)',
      maxHeight: 'calc(100% - 32px)',
    },
    '& h1': {
      opacity: '0',
    },
    '& .content': {
      opacity: '0',
      flexShrink: '1',
      overflow: 'auto',
      padding: '0 .1em',
    },
    '& .actions': {
      display: 'flex',
      justifyContent: 'space-between',
      paddingTop: '12px',
      opacity: '0',
    },
  },
  render: ({ props, children, useObservable, injector, useRef }) => {
    const h1Ref = useRef<HTMLHeadingElement>('h1')
    const contentRef = useRef<HTMLDivElement>('content')
    const actionsRef = useRef<HTMLDivElement>('actions')
    const formRef = useRef<HTMLFormElement>('form')

    setTimeout(() => {
      void showParallax(h1Ref.current)
      void showParallax(contentRef.current, { delay: 200, duration: 600 })
      void showParallax(actionsRef.current, { delay: 400, duration: 2000 })
    }, 1)

    const [isLargeScreen] = useObservable('screenSize', injector.getInstance(ScreenService).screenSize.atLeast.md, {
      onChange: (isLarge) => {
        const form = formRef.current
        if (form) {
          form.style.padding = '16px'
          form.style.width = isLarge ? '800px' : `${window.innerWidth - 16}px`
          form.style.height = isLarge ? '500px' : `${window.innerHeight - 192}px`
        }
      },
    })

    const form = formRef.current
    if (form) {
      form.style.padding = '16px'
      form.style.width = isLargeScreen ? '800px' : `${window.innerWidth - 16}px`
      form.style.height = isLargeScreen ? '500px' : `${window.innerHeight - 192}px`
    }

    return (
      <Form<Record<string, string>>
        ref={formRef}
        validate={props.validate ?? defaultValidate}
        onSubmit={async (data) => {
          if (props.onSubmit) {
            await props.onSubmit(data)
          } else {
            props.onNext?.()
          }
        }}
      >
        <h1 ref={h1Ref}>{props.title}</h1>
        <div ref={contentRef} className="content">
          {children}
        </div>
        <div ref={actionsRef} className="actions">
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
      </Form>
    )
  },
})
