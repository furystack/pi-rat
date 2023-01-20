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

export const GithubLogo = Shade<GithubLogoProps>({
  shadowDomName: 'github-logo',

  render: ({ props, useDisposable, useState, injector }) => {
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
    return <img {...props} src={theme === 'dark' ? ghLight : ghDark} alt="gh-logo" />
  },
})
