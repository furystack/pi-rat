import { Shade, createComponent } from '@furystack/shades'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { SeriesService } from '../../services/series-service.js'
import { SeriesWidget } from '../../components/dashboard/series-widget.js'

export const SeriesList = Shade({
  shadowDomName: 'shade-movie-list',
  render: ({ injector }) => {
    const seriesService = injector.getInstance(SeriesService)
    return (
      <PiRatLazyLoad
        component={async () => {
          const series = await seriesService.findSeries({})

          return (
            <div
              style={{ marginTop: '64px', display: 'flex', width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
              {series.entries.map((movie, index) => (
                <SeriesWidget index={index} imdbId={movie.imdbId} />
              ))}
            </div>
          )
        }}
      />
    )
  },
})
