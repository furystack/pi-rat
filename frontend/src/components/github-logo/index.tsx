/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createComponent, Shade } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'
// @ts-ignore
import ghLight from './gh-light.png'
// @ts-ignore
import ghDark from './gh-dark.png'
import { Trace } from '@furystack/utils'

type GithubLogoProps = Omit<Partial<HTMLImageElement>, 'style' | 'src' | 'alt'> & {
  style?: Partial<CSSStyleDeclaration> | undefined
}

export const GithubLogo = Shade<GithubLogoProps, { background: string }>({
  shadowDomName: 'github-logo',
  getInitialState: ({ injector }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const value = themeProvider.getTextColor(themeProvider.theme.background.paper, 'light', 'dark')
    return {
      background: value,
    }
  },
  resources: ({ injector, updateState }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    return [
      Trace.method({
        object: themeProvider,
        method: themeProvider.set,
        onFinished: () => {
          const value = themeProvider.getTextColor(themeProvider.theme.background.paper, 'light', 'dark')
          updateState({ background: value })
        },
      }),
    ]
  },
  render: ({ props, getState }) => {
    const { background } = getState()
    return <img {...props} src={background === 'dark' ? ghLight : ghDark} alt="gh-logo" />
  },
})
