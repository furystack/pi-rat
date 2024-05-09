/* eslint-disable @typescript-eslint/ban-ts-comment */
import { attachStyles, Shade } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'
// @ts-ignore
import ghLight from './gh-light.png'
// @ts-ignore
import ghDark from './gh-dark.png'
import { Trace } from '@furystack/utils'

type GithubLogoProps = {
  style?: Partial<CSSStyleDeclaration> | undefined
}

export const GithubLogo = Shade<GithubLogoProps>({
  shadowDomName: 'github-logo',
  elementBaseName: 'img',
  elementBase: HTMLImageElement,
  render: ({ props, useDisposable, useState, injector, element }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const [theme, setTheme] = useState(
      'themeName',
      themeProvider.getTextColor(themeProvider.theme.background.paper, 'light', 'dark'),
    )
    useDisposable('themeChange', () =>
      Trace.method({
        object: themeProvider,
        method: themeProvider.set,
        onFinished: () => {
          const value = themeProvider.getTextColor(themeProvider.theme.background.paper, 'light', 'dark')
          setTheme(value)
        },
      }),
    )

    attachStyles(element, props)
    Object.assign(element, {
      src: theme === 'dark' ? ghLight : ghDark,
      alt: 'gh-logo',
    })

    return null
  },
})
