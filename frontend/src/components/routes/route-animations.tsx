import { fadeOut, fadeIn } from '@furystack/shades-common-components'

export const onLeave = async ({ element }: { element: HTMLElement }) => {
  await fadeOut(element, { easing: 'ease-in', duration: 200 })
}

export const onVisit = async ({ element }: { element: HTMLElement }) => {
  await fadeIn(element, { easing: 'ease-out', duration: 750 })
}
