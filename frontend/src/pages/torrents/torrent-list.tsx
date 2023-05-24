import { Shade, createComponent } from '@furystack/shades'
import { TorrentService } from '../../services/torrents-service.js'
import { hasCacheValue } from '@furystack/cache'
import { Button, ThemeProviderService } from '@furystack/shades-common-components'

export const TorrentList = Shade({
  shadowDomName: 'pi-rat-torrent-list',
  constructed: ({ injector }) => {
    const interval = setInterval(() => {
      const torrentService = injector.getInstance(TorrentService)
      torrentService.torrentsCache.setObsolete()
      torrentService.getTorrents()
    }, 5000)
    return () => clearInterval(interval)
  },
  render: ({ injector, useObservable }) => {
    const torrentService = injector.getInstance(TorrentService)
    const { theme } = injector.getInstance(ThemeProviderService)

    const [torrents] = useObservable('torrents', torrentService.getTorrentsAsObservable())

    return (
      <table style={{ width: '100%' }}>
        <thead style={{ background: theme.background.paper }}>
          <tr>
            <th>Name</th>
            <th>Size</th>
            <th>Progress</th>
            <th>Download Speed</th>
            <th>Upload Speed</th>
            <th>Ratio</th>
            <th>Peers</th>
            <th>Time remaining</th>
            <th>State</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {hasCacheValue(torrents) ? (
            torrents.value.map((torrent) => {
              return (
                <tr>
                  <td style={{ width: '20vw' }}>{torrent.name}</td>
                  <td>{torrent.files.reduce((prev, file) => prev + file.length, 0)}</td>
                  <td>{Math.round(torrent.progress) * 100}%</td>
                  <td>{Math.round(torrent.downloadSpeed)}</td>
                  <td>{Math.round(torrent.uploadSpeed)}</td>
                  <td>{Math.round(torrent.ratio * 100) / 100}</td>
                  <td>{torrent.numPeers}</td>
                  <td>{Math.round(torrent.timeRemaining)}</td>
                  <td>{torrent.paused ? 'paused' : torrent.done ? 'seeding' : 'downloading'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {torrent.paused ? (
                        <Button onclick={() => torrentService.resumeTorrent(torrent.infoHash)}>Resume</Button>
                      ) : (
                        <Button onclick={() => torrentService.pauseTorrent(torrent.infoHash)}>Pause</Button>
                      )}
                      <Button onclick={() => torrentService.deleteTorrent(torrent.infoHash)}>Remove</Button>
                    </div>
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={9}>Loading...</td>
            </tr>
          )}
        </tbody>
      </table>
    )
  },
})
