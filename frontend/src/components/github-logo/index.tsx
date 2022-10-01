/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createComponent, Shade } from '@furystack/shades'
import type { Theme } from '@furystack/shades-common-components'
import { defaultDarkTheme, ThemeProviderService } from '@furystack/shades-common-components'
// @ts-ignore
import ghLight from './gh-light.png'
// @ts-ignore
import ghDark from './gh-dark.png'

type GithubLogoProps = Omit<Partial<HTMLImageElement>, 'style' | 'src' | 'alt'> & {
  style?: Partial<CSSStyleDeclaration> | undefined
}

export const GithubLogo = Shade<GithubLogoProps, { theme: Theme }>({
  shadowDomName: 'github-logo',
  getInitialState: ({ injector }) => ({
    theme: injector.getInstance(ThemeProviderService).theme.getValue(),
  }),
  resources: ({ injector, updateState }) => {
    return [injector.getInstance(ThemeProviderService).theme.subscribe((theme) => updateState({ theme }))]
  },
  render: ({ props, getState }) => {
    const { theme } = getState()
    return <img {...props} src={theme === defaultDarkTheme ? ghLight : ghDark} alt="gh-logo" />
  },
})
