import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'

export const BreadCrumbs = Shade<{
  currentDrive: string
  currentPath: string
  onChangePath: (newPath: string) => void
}>({
  shadowDomName: 'drives-breadcrumbs',
  render: ({ props, injector }) => {
    const { currentDrive: drive, currentPath: path, onChangePath: setPath } = props

    const segments = path.split('/').filter((s) => !!s)
    const { theme } = injector.getInstance(ThemeProviderService)

    const segmentsWithRelativePaths = segments.map((s, i) => ({
      name: s,
      path: segments.slice(0, i + 1).join('/'),
    }))

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.5em',
          letterSpacing: '0.1em',
        }}
      >
        {drive}:/
        {segmentsWithRelativePaths.map((s) => (
          <a
            style={{ color: theme.text.secondary, textDecoration: 'none', transition: 'color 0.2s ease-in-out' }}
            title={`${drive}:/${s.path}`}
            onmouseenter={(ev) => (ev.currentTarget as HTMLElement)?.style?.setProperty?.('color', theme.text.primary)}
            onmouseleave={(ev) =>
              (ev.currentTarget as HTMLElement)?.style?.setProperty?.('color', theme.text.secondary)
            }
            href="#"
            onclick={() => setPath(s.path)}
          >
            {s.name}/
          </a>
        ))}
      </div>
    )
  },
})
