import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '@furystack/shades-common-components'

export const BreadCrumbs = Shade<{
  currentDrive: string
  currentPath: string
  onChangePath: (newPath: string) => void
}>({
  shadowDomName: 'drives-breadcrumbs',
  css: {
    '& a': {
      color: cssVariableTheme.text.secondary,
      textDecoration: 'none',
      transition: 'color 0.2s ease-in-out',
    },
    '& a:hover': {
      color: cssVariableTheme.text.primary,
    },
  },
  render: ({ props }) => {
    const { currentDrive: drive, currentPath: path, onChangePath: setPath } = props

    const segments = path.split('/').filter((s) => !!s)

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
          <a title={`${drive}:/${s.path}`} href="#" onclick={() => setPath(s.path)}>
            {s.name}/
          </a>
        ))}
      </div>
    )
  },
})
