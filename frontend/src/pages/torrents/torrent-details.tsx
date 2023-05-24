import { Shade, createComponent } from '@furystack/shades'

export const TorrentDetails = Shade<{ torrentId: string }>({
  shadowDomName: 'pi-rat-torrent-details',
  render: () => {
    return <div>Torrent details</div>
  },
})
