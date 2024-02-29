import type { ChildrenList } from '@furystack/shades'
import { createComponent } from '@furystack/shades'
import type { Icon as IconModel } from '../../../common/src/models/icon.js'
import '@furystack/shades-lottie'

type IconProps = IconModel & {
  title?: string
  onclick?: (ev: MouseEvent) => void
}

export const Icon: (props: IconProps, children: ChildrenList) => JSX.Element = (props, children) => {
  const { type, value, ...restProps } = props

  if (type === 'font') {
    return <div {...restProps}>{value}</div>
  }
  if (type === 'url' || type === 'base64') {
    return <img {...restProps} alt="" src={value} />
  }
  if (type === 'lottie') {
    return <lottie-player {...value} {...restProps} />
  }

  return <>{children}</>
}
