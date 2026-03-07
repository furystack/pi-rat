import { Shade, createComponent } from '@furystack/shades'
import { Breadcrumb } from '@furystack/shades-common-components'

export const BreadCrumbs = Shade<{
  currentDrive: string
  currentPath: string
  onChangePath: (newPath: string) => void
}>({
  customElementName: 'drives-breadcrumbs',
  render: ({ props }) => {
    const { currentDrive: drive, currentPath: path, onChangePath: setPath } = props

    const segments = path.split('/').filter((s) => !!s)

    const segmentsWithRelativePaths = segments.map((s, i) => ({
      name: s,
      path: segments.slice(0, i + 1).join('/'),
    }))

    return (
      <Breadcrumb
        separator="/"
        homeItem={{
          path: '/',
          label: `${drive}:`,
          render: () => (
            <span style={{ cursor: 'pointer' }} onclick={() => setPath('/')}>
              {drive}:
            </span>
          ),
        }}
        items={segmentsWithRelativePaths.map((s) => ({
          path: `/${s.path}`,
          label: s.name,
          render: (item) => (
            <span title={`${drive}:/${s.path}`} style={{ cursor: 'pointer' }} onclick={() => setPath(s.path)}>
              {item.label}
            </span>
          ),
        }))}
        lastItemClickable={false}
      />
    )
  },
})
