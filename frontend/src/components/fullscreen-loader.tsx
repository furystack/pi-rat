import { Shade, createComponent } from '@furystack/shades'
import { Loader } from '@furystack/shades-common-components'

export const FullScreenLoader = Shade<{ message?: string }>({
  shadowDomName: 'pirat-fullscreen-loader',
  render: ({ props }) => {
    const { message = 'Loading...' } = props
    return (
      <div
        style={{
          display: 'flex',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '2em',
        }}>
        <style>{`
      @keyframes show{
        0%{
          opacity: 0;
        }
      
        100%{
          opacity: 1
        }
      }

      .initLoader {
        opacity: 0;
        animation: show .6s cubic-bezier(0.550, 0.085, 0.680, 0.530) 1s normal  forwards ;
      }
      `}</style>
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
          <h2>{message}</h2>
        </div>
      </div>
    )
  },
})
