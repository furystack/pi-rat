import { Shade, createComponent } from '@furystack/shades'
import { Loader, Typography } from '@furystack/shades-common-components'

export const FullScreenLoader = Shade<{ message?: string }>({
  customElementName: 'pirat-fullscreen-loader',
  css: {
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '2em',
    '& .initLoader': {
      opacity: '0',
      animation: 'show .6s cubic-bezier(0.550, 0.085, 0.680, 0.530) 1s normal forwards',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
  },
  render: ({ props }) => {
    const { message = 'Loading...' } = props
    return (
      <>
        <style>{`
          @keyframes show {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        `}</style>
        <div className="initLoader">
          <Loader
            style={{
              width: '128px',
              height: '128px',
            }}
          />
          <Typography variant="h2">{message}</Typography>
        </div>
      </>
    )
  },
})
