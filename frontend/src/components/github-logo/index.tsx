/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Shade } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'
// @ts-ignore
import ghLight from './gh-light.png'
// @ts-ignore
import ghDark from './gh-dark.png'

type GithubLogoProps = {
  style?: Partial<CSSStyleDeclaration> | undefined
}

export const GithubLogo = Shade<GithubLogoProps>({
  shadowDomName: 'github-logo',
  elementBaseName: 'img',
  elementBase: HTMLImageElement,
  render: ({ props, useDisposable, useState, injector, useHostProps }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const [theme, setTheme] = useState(
      'themeName',
      themeProvider.getTextColor(themeProvider.theme.background.paper, 'light', 'dark'),
    )
    useDisposable('themeChange', () =>
      themeProvider.subscribe('themeChanged', () => {
        const value = themeProvider.getTextColor(themeProvider.theme.background.paper, 'light', 'dark')
        setTheme(value)
      }),
    )

    useHostProps({
      src: theme === 'dark' ? ghLight : ghDark,
      alt: 'gh-logo',
      style: props.style as Record<string, string> | undefined,
    })

    return null
  },
})
