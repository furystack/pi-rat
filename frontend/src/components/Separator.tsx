import { Shade } from '@furystack/shades'

export const Separator = Shade({
  shadowDomName: 'shade-app-separator',
  style: { width: '100%', borderBottom: '1px solid rgba(128,128,128,0.5)', margin: '1em 0' },
  render: () => null,
})
