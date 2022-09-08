import { Shade, createComponent } from '@furystack/shades'
import { Loader } from '@furystack/shades-common-components'

export const Init = Shade({
  shadowDomName: 'shade-init',
  render: () => (
    <div
      style={{
        display: 'flex',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <div
        className="initLoader"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Loader
          style={{
            width: '128px',
            height: '128px',
          }}
        />
        <h2>Initializing app...</h2>
      </div>
    </div>
  ),
})
