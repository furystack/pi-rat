import { Shade, createComponent } from '@furystack/shades'
import type { DirectoryEntry } from 'common'
import { MovieFilesService } from '../../services/movie-files-service.js'
import { isLoadedCacheResult, isPendingCacheResult } from '@furystack/cache'
import { Button, Skeleton } from '@furystack/shades-common-components'
import { InstallService } from '../../services/install-service.js'
import { MediaApiClient } from '../../services/api-clients/media-api-client.js'
import { MovieWidget } from '../dashboard/movie-widget.js'

export const RelatedMoviesModalContent = Shade<{
  file: DirectoryEntry
  drive: string
  path: string
}>({
  shadowDomName: 'shade-app-related-movies-modal-content',
  render: ({ useObservable, injector, props }) => {
    const { drive, path, file } = props

    const linkedFilesService = injector.getInstance(MovieFilesService)
    const [linkedFiles] = useObservable(
      'linkedFiles',
      linkedFilesService.findMovieFileAsObservable({
        filter: {
          driveLetter: { $eq: drive },
          path: { $eq: path },
          fileName: { $eq: file.name },
        },
      }),
    )

    const [serviceStatus] = useObservable(
      'serviceStatus',
      injector.getInstance(InstallService).getServiceStatusAsObservable(),
    )

    if (isPendingCacheResult(linkedFiles)) {
      return <Skeleton />
    }

    if (isLoadedCacheResult(linkedFiles)) {
      if (linkedFiles.value.count === 0) {
        return (
          <>
            <p>
              No related movies found
              <>
                {serviceStatus.status === 'loaded' && serviceStatus.value.services.omdb ? (
                  <Button
                    onclick={async () => {
                      const mediaApiClient = injector.getInstance(MediaApiClient)
                      await mediaApiClient.call({
                        method: 'POST',
                        action: '/link-movie',
                        body: {
                          drive,
                          path,
                          fileName: file.name,
                        },
                      })
                      linkedFilesService.movieFileQueryCache.obsoleteRange(() => true)
                    }}>
                    🔍 Search on OMDB
                  </Button>
                ) : (
                  <Button disabled>OMDB not available</Button>
                )}
              </>
            </p>
          </>
        )
      } else {
        return (
          <>
            {`Found ${linkedFiles.value.count} related movies`}
            {linkedFiles.value.entries.map((linkedFile) => (
              <MovieWidget imdbId={linkedFile.imdbId} />
            ))}
          </>
        )
      }
    }

    return (
      <div>
        <h1>Related movies</h1>
      </div>
    )
  },
})
