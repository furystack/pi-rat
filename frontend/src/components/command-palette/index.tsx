import { Shade, createComponent } from '@furystack/shades'
import { CommandPalette } from '@furystack/shades-common-components'
import { CommandProviderRegistry } from '../../services/registries/index.js'

export const PiRatCommandPalette = Shade({
  customElementName: 'pirat-command-palette',
  render: ({ injector }) => {
    const providers = injector.getInstance(CommandProviderRegistry).getProviders()
    return <CommandPalette commandProviders={providers} defaultPrefix=">" />
  },
})
