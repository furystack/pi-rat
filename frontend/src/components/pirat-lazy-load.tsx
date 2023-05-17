import type { LazyLoadProps } from '@furystack/shades'
import { LazyLoad, Shade, createComponent } from '@furystack/shades'
import { FullScreenLoader } from './fullscreen-loader.js'
import { GenericErrorPage } from './generic-error.js'

export const PiRatLazyLoad = Shade<Pick<LazyLoadProps, 'component'>>({
  shadowDomName: 'shade-pirat-lazy-load',
  render: ({ props, children }) => {
    return (
      <LazyLoad
        loader={<FullScreenLoader message="Loading..." />}
        error={(error, retry) => <GenericErrorPage error={error} retry={retry} />}
        component={props.component}>
        {children}
      </LazyLoad>
    )
  },
})
