import { LazyLoad, Shade, createComponent } from '@furystack/shades'
import { getErrorMessage } from '../services/get-error-message'

export const ErrorDisplay = Shade<{ error?: unknown }>({
  shadowDomName: 'shade-error-display',
  render: ({ props }) => {
    if (!props.error) {
      return null
    }
    return (
      <LazyLoad
        loader={<></>}
        component={async () => {
          const message = await getErrorMessage(props.error)
          return <span>{message}</span>
        }}
      />
    )
  },
})
