import { createComponent, type TitleResolverOptions } from '@furystack/shades'
import { icons } from '@furystack/shades-common-components'
import { decode } from 'common'
import type { MatchResult } from 'path-to-regexp'
import { PiRatLazyLoad } from '../components/pirat-lazy-load.js'

export const fileBrowserRoute = {
  meta: { title: 'File Browser', icon: icons.folderOpen },
  component: () => (
    <PiRatLazyLoad
      component={async () => {
        const { DrivesPage } = await import('../pages/file-browser/index.js')
        return <DrivesPage />
      }}
    />
  ),
  children: {
    '/open-file/:driveLetter/:path': {
      meta: {
        title: ({ match }: TitleResolverOptions<{ driveLetter: string; path: string }>): string =>
          decode<string>(match.params.path),
        icon: icons.file,
        hidden: true,
      },
      component: ({ match }: { match: MatchResult<{ driveLetter: string; path: string }> }) => (
        <PiRatLazyLoad
          component={async () => {
            const { FilesPage } = await import('../pages/files/index.js')
            return <FilesPage letter={decode(match.params.driveLetter)} path={decode(match.params.path)} />
          }}
        />
      ),
    },
    '/': { component: () => <></>, routingOptions: { end: false } },
  },
}
