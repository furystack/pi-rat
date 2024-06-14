import { createComponent, Shade } from '@furystack/shades'
import type { ButtonProps } from '@furystack/shades-common-components'
import { getCssVariable } from '@furystack/shades-common-components'
import { Button, ThemeProviderService } from '@furystack/shades-common-components'
import { Trace } from '@furystack/utils'
import { darkTheme } from '../../themes/dark.js'
import { lightTheme } from '../../themes/light.js'

export const ThemeSwitch = Shade<Omit<ButtonProps, 'onclick'>>({
  shadowDomName: 'theme-switch',
  render: ({ props, injector, useState, useDisposable }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const [theme, setTheme] = useState<'light' | 'dark'>(
      'theme',
      getCssVariable(themeProvider.theme.background.default) === darkTheme.background.default ? 'dark' : 'light',
    )

    useDisposable('traceThemeChange', () =>
      Trace.method({
        object: themeProvider,
        method: themeProvider.set,
        onFinished: () => {
          setTheme(
            getCssVariable(themeProvider.theme.background.default) === darkTheme.background.default ? 'dark' : 'light',
          )
        },
      }),
    )

    return (
      <Button
        {...props}
        onclick={() => {
          themeProvider.set(theme === 'dark' ? lightTheme : darkTheme)
        }}
      >
        {theme === 'dark' ? '☀️' : '🌜'}
      </Button>
    )
  },
})
