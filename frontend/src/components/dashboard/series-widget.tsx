import type { CacheWithValue } from '@furystack/cache'
import { Shade, createComponent } from '@furystack/shades'
import { CacheView, Skeleton } from '@furystack/shades-common-components'
import type { Series } from 'common'
import { AppLink } from '../../app-routes.js'
import { SeriesService } from '../../services/series-service.js'
import { WidgetCard } from './widget-card.js'

const SeriesWidgetContent = Shade<{
  data: CacheWithValue<Series>
  index?: number
  size?: number
}>({
  shadowDomName: 'pi-rat-series-widget-content',
  render: ({ props }) => {
    const { size = 256 } = props
    const series = props.data.value
    const { imdbId } = series

    return (
      <AppLink tabIndex={0} title={series.plot || series.title} href="/series/:imdbId" params={{ imdbId }}>
        <WidgetCard size={size} index={props.index}>
          <img
            src={series.thumbnailImageUrl as string}
            alt={series.title}
            className="cover"
            style={{ backgroundColor: '#666' }}
          />
          <div className="title-bar">{series.title}</div>
        </WidgetCard>
      </AppLink>
    )
  },
})

export const SeriesWidget = Shade<{
  imdbId: string
  index?: number
  size?: number
}>({
  shadowDomName: 'pi-rat-series-widget',
  render: ({ props, injector }) => {
    const seriesService = injector.getInstance(SeriesService)

    return (
      <CacheView
        cache={seriesService.seriesCache}
        args={[props.imdbId]}
        content={SeriesWidgetContent}
        contentProps={{ index: props.index, size: props.size }}
        loader={<Skeleton />}
        error={() => <>:(</>}
      />
    )
  },
})
