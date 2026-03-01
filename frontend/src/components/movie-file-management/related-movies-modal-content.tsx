import type { CacheWithValue } from '@furystack/cache'
import type { GetCollectionResult } from '@furystack/rest'
import { Shade, createComponent } from '@furystack/shades'
import { Button, CacheView, Skeleton, Typography } from '@furystack/shades-common-components'
import { getFullPath, type DirectoryEntry, type MovieFile } from 'common'
import { MediaApiClient } from '../../services/api-clients/media-api-client.js'
import { InstallService } from '../../services/install-service.js'
import { MovieFilesService } from '../../services/movie-files-service.js'
import { MovieWidget } from '../dashboard/movie-widget.js'

const RelatedMoviesContent = Shade<{
  data: CacheWithValue<GetCollectionResult<MovieFile>>
  drive: string
  path: string
  file: DirectoryEntry
}>({
  shadowDomName: 'shade-app-related-movies-content',
  render: ({ props, useObservable, injector }) => {
    const { drive, path, file } = props
    const linkedFiles = props.data

    const linkedFilesService = injector.getInstance(MovieFilesService)

    const [serviceStatus] = useObservable(
      'serviceStatus',
      injector.getInstance(InstallService).getServiceStatusAsObservable(),
    )

    if (linkedFiles.value.count === 0) {
      return (
        <>
          <Typography variant="body1">
            No related movie is linked to this file
            <>
              {serviceStatus.status === 'loaded' && serviceStatus.value.services.omdb ? (
                <Button
                  onclick={async () => {
                    const mediaApiClient = injector.getInstance(MediaApiClient)
                    await mediaApiClient.call({
                      method: 'POST',
                      action: '/link-movie',
                      body: {
                        driveLetter: drive,
                        path: getFullPath(path, file.name),
                      },
                    })
                    linkedFilesService.movieFileQueryCache.obsoleteRange(() => true)
                  }}
                >
                  🔗 Link movie
                </Button>
              ) : (
                <Button disabled>OMDB not available</Button>
              )}
            </>
          </Typography>
        </>
      )
    }

    return (
      <>
        {`Found ${linkedFiles.value.count} related movies`}
        {linkedFiles.value.entries.map((linkedFile) => (
          <MovieWidget imdbId={linkedFile.imdbId as string} />
        ))}
      </>
    )
  },
})

export const RelatedMoviesModalContent = Shade<{
  file: DirectoryEntry
  drive: string
  path: string
}>({
  shadowDomName: 'shade-app-related-movies-modal-content',
  render: ({ injector, props }) => {
    const { drive, path, file } = props
    const linkedFilesService = injector.getInstance(MovieFilesService)

    return (
      <CacheView
        cache={linkedFilesService.movieFileQueryCache}
        args={[
          {
            filter: {
              driveLetter: { $eq: drive },
              path: { $eq: getFullPath(path, file.name) },
            },
          },
        ]}
        content={RelatedMoviesContent}
        contentProps={{ drive, path, file }}
        loader={<Skeleton />}
        error={() => <>:(</>}
      />
    )
  },
})
