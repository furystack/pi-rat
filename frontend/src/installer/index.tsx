import { createComponent, Shade } from '@furystack/shades'
import { Wizard } from '@furystack/shades-common-components'

export const InstallerPage = Shade({
  shadowDomName: 'shade-installer-page',
  render: () => {
    return (
      <Wizard
        isOpened
        steps={[]}
        onFinish={() => {
          window.location.reload()
        }}
      />
    )
  },
})
