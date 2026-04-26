import { createComponent, LocationService, Shade } from '@furystack/shades'
import type { NavTreeNode } from '@furystack/shades'
import { cssVariableTheme, Icon } from '@furystack/shades-common-components'
import { extractNavTree } from '@furystack/shades'
import { appRoutes } from '../routes/index.js'

const getParentNavChildren = (currentPath: string): NavTreeNode[] => {
  const tree = extractNavTree(appRoutes as Parameters<typeof extractNavTree>[0])

  const findNode = (nodes: NavTreeNode[], path: string): NavTreeNode | undefined => {
    for (const node of nodes) {
      if (path === node.fullPath || path.startsWith(`${node.fullPath}/`)) {
        if (node.children) {
          const deeper = findNode(node.children, path)
          if (deeper) return deeper
        }
        return node
      }
    }
    return undefined
  }

  const parentNode = findNode(tree, currentPath)
  return parentNode?.children?.filter((c) => c.pattern !== '/' && !c.meta?.hidden) ?? []
}

type RouteIndexPageProps = {
  outlet?: JSX.Element
}

export const RouteIndexPage = Shade<RouteIndexPageProps>({
  customElementName: 'pi-rat-route-index-page',
  css: {
    '& .index-grid': {
      display: 'flex',
      flexWrap: 'wrap',
      gap: cssVariableTheme.spacing.md,
      padding: cssVariableTheme.spacing.lg,
      justifyContent: 'center',
    },
    '& .index-card': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '180px',
      height: '160px',
      borderRadius: cssVariableTheme.shape.borderRadius.md,
      background: cssVariableTheme.action.hoverBackground,
      boxShadow: cssVariableTheme.shadows.md,
      cursor: 'pointer',
      textDecoration: 'none',
      color: cssVariableTheme.text.primary,
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      gap: cssVariableTheme.spacing.sm,
    },
    '& .index-card:hover': {
      transform: 'translateY(-2px)',
      boxShadow: cssVariableTheme.shadows.lg,
    },
    '& .index-card-icon': {
      fontSize: '2rem',
    },
    '& .index-card-label': {
      fontSize: '0.9rem',
      fontWeight: '500',
      textAlign: 'center',
    },
  },
  render: ({ props, injector, useObservable }) => {
    const locationService = injector.get(LocationService)
    const [currentPath] = useObservable('locationChange', locationService.onLocationPathChanged)

    const navigate = (path: string) => {
      locationService.navigate(path)
    }

    const children = getParentNavChildren(currentPath)
    const isAtIndex = children.length > 0 && !children.some((c) => currentPath.startsWith(c.fullPath))

    if (!isAtIndex) {
      return <>{props.outlet}</>
    }

    return (
      <div className="index-grid">
        {children.map((node) => (
          <div
            className="index-card"
            tabIndex={0}
            onclick={() => navigate(node.fullPath)}
            onkeydown={(e: KeyboardEvent) => {
              if (e.key === 'Enter') navigate(node.fullPath)
            }}
          >
            <div className="index-card-icon">{node.meta?.icon ? <Icon icon={node.meta.icon} /> : null}</div>
            <div className="index-card-label">{node.meta?.title ?? node.pattern}</div>
          </div>
        ))}
      </div>
    )
  },
})
