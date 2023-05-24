import { createComponent } from '@furystack/shades'
import { TorrentListPage } from '../../pages/torrents/torrent-list-page.js'
import { onLeave, onVisit } from './route-animations.js'
import type { MatchResult } from 'path-to-regexp'
import { TorrentDetails } from '../../pages/torrents/torrent-details.js'

export const torrentDetailsRoute = {
  url: '/torrents/:id',
  routingOptions: { end: false },
  onVisit,
  onLeave,
  component: ({ match }: { match: MatchResult<{ id: string }> }) => {
    return <TorrentDetails torrentId={match.params.id} />
  },
}

export const torrentListRoute = {
  url: '/torrents',
  routingOptions: { end: false },
  onVisit,
  onLeave,
  component: () => <TorrentListPage />,
}

export const torrentRoutes = [torrentDetailsRoute, torrentListRoute]
