import { createComponent, Shade } from '@furystack/shades'
import type { ButtonProps } from '@furystack/shades-common-components'
import { getCssVariable } from '@furystack/shades-common-components'
import { Button, defaultDarkTheme, defaultLightTheme, ThemeProviderService } from '@furystack/shades-common-components'
import { Trace } from '@furystack/utils'

export const ThemeSwitch = Shade<Omit<ButtonProps, 'onclick'>>({
  shadowDomName: 'theme-switch',
  render: ({ props, injector, useState, useDisposable }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const [theme, setTheme] = useState<'light' | 'dark'>(
      'theme',
      getCssVariable(themeProvider.theme.background.default) === defaultDarkTheme.background.default ? 'dark' : 'light',
    )

    useDisposable('traceThemeChange', () =>
      Trace.method({
        object: themeProvider,
        method: themeProvider.set,
        onFinished: () => {
          setTheme(
            getCssVariable(themeProvider.theme.background.default) === defaultDarkTheme.background.default
              ? 'dark'
              : 'light',
          )
        },
      }),
    )

    return (
      <Button
        {...props}
        onclick={() => {
          themeProvider.set(theme === 'dark' ? defaultLightTheme : defaultDarkTheme)
        }}>
        {theme === 'dark' ? '☀️' : '🌜'}
      </Button>
    )
  },
})
