import { createComponent, Shade } from '@furystack/shades'
import { Button } from '@furystack/shades-common-components'

export const ButtonsDemo = Shade({
  shadowDomName: 'buttons-demo',
  render: ({ useState }) => {
    const [disabled, setDisabled] = useState('disabled', false)
    const txt = 'Button Text'
    const onclick = () => {
      /** */
    }
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '5em',
          flexDirection: 'column',
          background: 'url(https://talkillustration.com/wp-content/uploads/2015/04/ghtyj.jpg)',
        }}>
        <div>
          <div>
            <Button onclick={onclick} disabled={disabled}>
              {txt}
            </Button>

            <Button onclick={onclick} disabled={disabled} color="primary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={disabled} color="secondary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={disabled} color="error">
              {txt}
            </Button>
          </div>
          <div>
            <Button onclick={onclick} disabled={disabled} variant="outlined">
              {txt}
            </Button>

            <Button onclick={onclick} disabled={disabled} variant="outlined" color="primary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={disabled} variant="outlined" color="secondary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={disabled} variant="outlined" color="error">
              {txt}
            </Button>
          </div>
          <div>
            <Button onclick={onclick} disabled={disabled} variant="contained">
              {txt}
            </Button>

            <Button onclick={onclick} disabled={disabled} variant="contained" color="primary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={disabled} variant="contained" color="secondary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={disabled} variant="contained" color="error">
              {txt}
            </Button>
          </div>
        </div>
        <Button
          onclick={() => {
            setDisabled(!disabled)
          }}>
          Disable All
        </Button>
      </div>
    )
  },
})
