import type { ChildrenList } from '@furystack/shades'
import { createComponent } from '@furystack/shades'
import '@furystack/shades-lottie'
import type { Icon as IconModel } from 'common'

type DynamicIconProps = IconModel & {
  title?: string
  onclick?: (ev: MouseEvent) => void
  style?: Partial<CSSStyleDeclaration>
}

export const DynamicIcon: (props: DynamicIconProps, children: ChildrenList) => JSX.Element = (props, children) => {
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
