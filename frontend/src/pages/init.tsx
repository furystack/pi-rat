import { Shade, createComponent } from '@furystack/shades'
import { Loader, Typography } from '@furystack/shades-common-components'

export const Init = Shade({
  customElementName: 'shade-init',
  css: {
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    '& .initLoader': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
  },
  render: () => (
    <div className="initLoader">
      <Loader
        style={{
          width: '128px',
          height: '128px',
        }}
      />
      <Typography variant="h2">Initializing app...</Typography>
    </div>
  ),
})
