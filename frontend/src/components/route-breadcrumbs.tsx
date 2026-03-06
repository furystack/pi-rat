import type { Injector } from '@furystack/inject'
import type { MatchChainEntry } from '@furystack/shades'
import { createComponent, LocationService, RouteMatchService, Shade } from '@furystack/shades'
import type { IconDefinition } from '@furystack/shades-common-components'
import { Breadcrumb, cssVariableTheme, Icon } from '@furystack/shades-common-components'

type BreadcrumbEntry = {
  path: string
  label: string
  icon?: IconDefinition
}

const resolveTitleSync = (entry: MatchChainEntry, injector: Injector): string | undefined => {
  const title = entry.route.meta?.title
  if (!title) return undefined
  if (typeof title === 'string') return title
  const result = title({ match: entry.match, injector })
  if (typeof result === 'string') return result
  return undefined
}

const buildBreadcrumbEntries = (matchChain: MatchChainEntry[], injector: Injector): BreadcrumbEntry[] => {
  let accumulatedPath = ''
  const entries: BreadcrumbEntry[] = []

  for (const entry of matchChain) {
    accumulatedPath += entry.match.path
    const label = resolveTitleSync(entry, injector)
    if (!label) continue

    entries.push({
      path: accumulatedPath,
      label,
      icon: entry.route.meta?.icon,
    })
  }

  return entries
}

export const RouteBreadcrumbs = Shade({
  shadowDomName: 'pi-rat-route-breadcrumbs',
  css: {
    '& .breadcrumb-item': {
      display: 'inline-flex',
      alignItems: 'center',
      gap: cssVariableTheme.spacing.xs,
      cursor: 'pointer',
      color: cssVariableTheme.text.secondary,
      textDecoration: 'none',
      fontSize: '0.875rem',
    },
    '& .breadcrumb-item:hover': {
      color: cssVariableTheme.text.primary,
    },
    '& .breadcrumb-item[data-active="true"]': {
      color: cssVariableTheme.text.primary,
      cursor: 'default',
    },
  },
  render: ({ injector, useObservable }) => {
    const routeMatchService = injector.getInstance(RouteMatchService)
    const locationService = injector.getInstance(LocationService)
    const [matchChain] = useObservable('matchChain', routeMatchService.currentMatchChain)

    const displayEntries = buildBreadcrumbEntries(matchChain, injector)

    if (!displayEntries.length) return <></>

    return (
      <Breadcrumb
        separator="/"
        items={displayEntries.map((entry) => ({
          path: entry.path,
          label: entry.label,
          render: (_item, isActive) => (
            <span
              className="breadcrumb-item"
              data-active={isActive ? 'true' : 'false'}
              onclick={(e: Event) => {
                if (!isActive) {
                  e.preventDefault()
                  locationService.navigate(entry.path)
                }
              }}
            >
              {entry.icon ? <Icon icon={entry.icon} size="small" /> : null}
              {entry.label}
            </span>
          ),
        }))}
      />
    )
  },
})
