import { createComponent, Shade } from '@furystack/shades'
import { animations, Button, WizardStepProps } from '@furystack/shades-common-components'

export const WizardStep = Shade<{ title: string } & WizardStepProps>({
  shadowDomName: 'wizard-step',
  render: ({ props, element, children }) => {
    setTimeout(() => {
      animations.showParallax(element.querySelector('h1'))
      animations.showParallax(element.querySelector('div.content'), { delay: 200, duration: 600 })
      animations.showParallax(element.querySelector('div.actions'), { delay: 400, duration: 2000 })
    }, 1)
    return (
      <form
        onsubmit={(ev) => {
          ev.preventDefault()
          props.onNext?.()
        }}
        style={{
          width: '800px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          height: '430px',
          justifyContent: 'space-between',
        }}>
        <h1 style={{ opacity: '0' }}>{props.title}</h1>
        <div style={{ opacity: '0' }} className="content">
          {children}
        </div>
        <div
          className="actions"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
            opacity: '0',
          }}>
          <Button onclick={() => props.onPrev?.()} disabled={props.currentPage < 1} variant="outlined">
            Previous
          </Button>
          <Button
            type="submit"
            disabled={props.currentPage > props.maxPages - 1}
            variant="contained"
            color={props.currentPage === props.maxPages - 1 ? 'success' : 'primary'}>
            {props.currentPage < props.maxPages - 1 ? 'Next' : 'Finish'}
          </Button>
        </div>
      </form>
    )
  },
})
