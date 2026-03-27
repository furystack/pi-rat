import type { CacheWithValue } from '@furystack/cache'
import { Shade, createComponent } from '@furystack/shades'
import { CacheView, cssVariableTheme, Skeleton } from '@furystack/shades-common-components'
import type { Series, SeriesMetadataLocalized } from 'common'
import { AppLink } from '../../routes/index.js'
import { LocalizedMetadataService } from '../../services/localized-metadata-service.js'
import { SeriesService } from '../../services/series-service.js'
import { WidgetCard } from './widget-card.js'

const SeriesWidgetContent = Shade<{
  data: CacheWithValue<Series>
  index?: number
  size?: number
}>({
  customElementName: 'pi-rat-series-widget-content',
  render: ({ props, injector, useObservable }) => {
    const { size = 256 } = props
    const series = props.data.value
    const { imdbId } = series

    const localizedService = injector.getInstance(LocalizedMetadataService)
    const [localized] = useObservable('localized', localizedService.getSeriesLocalizedAsObservable(imdbId))

    const localizedData = (localized as CacheWithValue<SeriesMetadataLocalized | undefined> | undefined)?.value
    const title = localizedData?.title ?? imdbId
    const plot = localizedData?.plot
    const posterUrl = localizedData?.posterUrl

    return (
      <AppLink tabIndex={0} title={plot || title} href="/series/:imdbId" params={{ imdbId }}>
        <WidgetCard size={size} index={props.index}>
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={title}
              className="cover"
              style={{ backgroundColor: cssVariableTheme.background.default }}
            />
          ) : (
            <div className="cover" style={{ backgroundColor: cssVariableTheme.background.default }} />
          )}
          <div className="title-bar">{title}</div>
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
  customElementName: 'pi-rat-series-widget',
  render: ({ props, injector }) => {
    const seriesService = injector.getInstance(SeriesService)

    return (
      <CacheView
        cache={seriesService.seriesCache}
        args={[props.imdbId]}
        content={SeriesWidgetContent}
        contentProps={{ index: props.index, size: props.size }}
        loader={<Skeleton />}
      />
    )
  },
})
