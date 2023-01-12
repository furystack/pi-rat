import { createComponent, Shade } from '@furystack/shades'
import type { ButtonProps } from '@furystack/shades-common-components'
import { getCssVariable } from '@furystack/shades-common-components'
import { Button, defaultDarkTheme, defaultLightTheme, ThemeProviderService } from '@furystack/shades-common-components'
import { Trace } from '@furystack/utils'

export const ThemeSwitch = Shade<Omit<ButtonProps, 'onclick'>, { theme: 'light' | 'dark' }>({
  shadowDomName: 'theme-switch',
  getInitialState: ({ injector }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    return {
      theme:
        getCssVariable(themeProvider.theme.background.default) === defaultDarkTheme.background.default
          ? 'dark'
          : 'light',
    }
  },
  resources: ({ injector, updateState }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    return [
      Trace.method({
        object: themeProvider,
        method: themeProvider.set,
        onFinished: () => {
          updateState({
            theme:
              getCssVariable(themeProvider.theme.background.default) === defaultDarkTheme.background.default
                ? 'dark'
                : 'light',
          })
        },
      }),
    ]
  },
  render: ({ props, injector, getState }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const { theme } = getState()
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
