import { Shade, createComponent } from '@furystack/shades'
import { TorrentService } from '../../services/torrents-service.js'
import { TorrentList } from './torrent-list.js'

export const TorrentListPage = Shade({
  shadowDomName: 'pi-rat-torrent-list-page',
  render: ({ injector }) => {
    const torrentService = injector.getInstance(TorrentService)

    return (
      <div style={{ padding: '1em', paddingTop: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1>Torrents</h1>
          <div>
            <input
              type="file"
              accept=".torrent"
              onchange={(e) => {
                const { files } = e.target as HTMLInputElement
                if (files) {
                  torrentService.uploadTorrents(...files)
                }
              }}
              title="Add new Torrent file"
            ></input>
          </div>
        </div>
        <TorrentList />
      </div>
    )
  },
})
