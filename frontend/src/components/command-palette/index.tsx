import { Shade, createComponent } from '@furystack/shades'
import { CommandPalette } from '@furystack/shades-common-components'
import { browserCommandProvider } from './command-providers/browser.js'
import { entitiesCommandProvider } from './command-providers/entities.js'

export const PiRatCommandPalette = Shade({
  shadowDomName: 'pirat-command-palette',
  render: () => {
    return <CommandPalette commandProviders={[browserCommandProvider, entitiesCommandProvider]} defaultPrefix=">" />
  },
})
