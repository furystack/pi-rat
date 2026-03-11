import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import {
  Config,
  Drive,
  getFallbackMetadata,
  getFileName,
  getParentPath,
  isMovieFile,
  isSampleFile,
  MovieFile,
  OmdbMovieMetadata,
  type MetadataProviderConfig,
  type PiRatFile,
} from 'common'
import { FfprobeService } from '../../../ffprobe-service.js'
import { getPhysicalParentPath } from '../../../utils/physical-path-utils.js'
import { OmdbClientService } from '../metadata-services/omdb-client-service.js'
import { TmdbClientService } from '../metadata-services/tmdb-client-service.js'
import { ensureMovieExists } from './ensure-movie-exists.js'
import { extractImdbIdFromFfprobeTags } from './extract-imdb-id-from-tags.js'
import { extractImdbIdFromNfoFiles } from './extract-imdb-id-from-nfo.js'
import { ensureOmdbMovieExists } from './ensure-omdb-movie-exists.js'
import { ensureOmdbSeriesExists } from './ensure-omdb-series-exists.js'
import { ensureTmdbMovieExists } from './ensure-tmdb-movie-exists.js'
import { ensureTmdbSeriesExists } from './ensure-tmdb-series-exists.js'
import { ensureMovieLocalizedMetadataExists } from './ensure-localized-metadata-exists.js'
import { mapOmdbMovieToLocalized } from './map-omdb-to-localized.js'
import { mapTmdbMovieToLocalized } from './map-tmdb-to-localized.js'

type ProviderResult = { status: 'skip' } | { status: 'rate-limited' } | { status: 'linked'; imdbId: string }

const getProviderPriority = async (injector: Injector): Promise<Array<'omdb' | 'tmdb'>> => {
  try {
    const configDataSet = getDataSetFor(injector, Config, 'id')
    const config = await configDataSet.get(injector, 'METADATA_PROVIDER_CONFIG')
    if (config) {
      return (config as MetadataProviderConfig).value.priority
    }
  } catch {
    // Config not found, use default
  }
  return ['omdb', 'tmdb']
}

const tryOmdbProvider = async (
  injector: Injector,
  { title, year, season, episode }: { title: string; year?: number; season?: number; episode?: number },
  context?: { file?: PiRatFile },
): Promise<ProviderResult> => {
  const omdbClientService = injector.getInstance(OmdbClientService)
  const result = await omdbClientService.fetchOmdbMovieMetadata({ title, year, season, episode }, context)

  if (result.status === 'not-configured') return { status: 'skip' }
  if (result.status === 'rate-limited') return { status: 'rate-limited' }
  if (result.status === 'not-found') return { status: 'skip' }
  if (result.status === 'error') return { status: 'skip' }

  const added = await ensureOmdbMovieExists(result.data, injector)
  await ensureMovieExists(
    {
      imdbId: added.imdbID,
      year: parseInt(added.Year, 10),
      season: added.Season ? parseInt(added.Season, 10) : undefined,
      episode: added.Episode ? parseInt(added.Episode, 10) : undefined,
      type: added.Type,
      duration: added.Runtime ? parseInt(added.Runtime, 10) : undefined,
      seriesId: added.seriesID,
    },
    injector,
  )
  await ensureMovieLocalizedMetadataExists(mapOmdbMovieToLocalized(added), injector)
  await ensureOmdbSeriesExists(added, injector, context)

  return { status: 'linked', imdbId: added.imdbID }
}

const tryTmdbProvider = async (
  injector: Injector,
  { title, year, season, episode }: { title: string; year?: number; season?: number; episode?: number },
  context?: { file?: PiRatFile },
): Promise<ProviderResult> => {
  const tmdbClientService = injector.getInstance(TmdbClientService)
  const result = await tmdbClientService.fetchTmdbMovieMetadata({ title, year, season, episode }, context)

  if (result.status === 'not-configured') return { status: 'skip' }
  if (result.status === 'rate-limited') return { status: 'rate-limited' }
  if (result.status === 'not-found') return { status: 'skip' }
  if (result.status === 'error') return { status: 'skip' }

  const { movie: tmdbMovie, series: tmdbSeries } = result.data
  const imdbId = tmdbMovie.imdb_id
  if (!imdbId) return { status: 'skip' }

  const language = tmdbClientService.config?.value.defaultLanguage?.slice(0, 2) ?? 'en'

  await ensureTmdbMovieExists(tmdbMovie, language, injector)

  await ensureMovieExists(
    {
      imdbId,
      year: tmdbMovie.release_date ? parseInt(tmdbMovie.release_date.slice(0, 4), 10) : undefined,
      duration: tmdbMovie.runtime || undefined,
      type: tmdbSeries ? 'episode' : 'movie',
      seriesId: tmdbSeries?.external_ids?.imdb_id ?? undefined,
      season: result.data.episode?.season_number,
      episode: result.data.episode?.episode_number,
    },
    injector,
  )
  await ensureMovieLocalizedMetadataExists(mapTmdbMovieToLocalized(tmdbMovie, language), injector)

  if (tmdbSeries) {
    const seriesImdbId = tmdbSeries.external_ids?.imdb_id
    if (seriesImdbId) {
      await ensureTmdbSeriesExists(seriesImdbId, tmdbSeries, language, injector, context)
    }
  }

  return { status: 'linked', imdbId }
}

/**
 * Tries each configured provider to populate localized metadata for a movie
 * already linked via a direct IMDB ID (ffprobe tags or .nfo file).
 */
const enrichMetadataFromProviders = async (
  injector: Injector,
  params: { title: string; year?: number; season?: number; episode?: number },
  context?: { file?: PiRatFile },
) => {
  const priority = await getProviderPriority(injector)
  const providers: Record<string, typeof tryOmdbProvider> = {
    omdb: tryOmdbProvider,
    tmdb: tryTmdbProvider,
  }

  for (const provider of priority) {
    const tryProvider = providers[provider]
    if (!tryProvider) continue

    const result = await tryProvider(injector, params, context)
    if (result.status === 'linked') return
    if (result.status === 'rate-limited') return
  }
}

export const linkMovie = async (options: { injector: Injector; file: PiRatFile }) => {
  const logger = getLogger(options.injector).withScope('linkMovie')

  const { injector, file } = options
  const { driveLetter, path } = file
  const fileName = getFileName(file)

  if (!isMovieFile(fileName)) {
    await logger.debug({
      message: `File ${fileName} is not a movie file, skipping link process.`,
      data: { file },
    })
    return { status: 'not-movie-file' } as const
  }

  if (isSampleFile(fileName)) {
    await logger.debug({
      message: `File ${fileName} is a sample file, skipping link process.`,
      data: { file },
    })
    return { status: 'not-movie-file' } as const
  }

  const { title, year, season, episode } = getFallbackMetadata(path)

  const movieFileDataSet = getDataSetFor(injector, MovieFile, 'id')

  const storedMovieFile = await movieFileDataSet.find(injector, {
    filter: {
      driveLetter: { $eq: driveLetter },
      path: { $eq: path },
    },
  })

  if (storedMovieFile.length > 0) {
    await logger.debug({
      message: `File ${fileName} is already linked to a movie file.`,
      data: { file, storedMovieFile },
    })
    return { status: 'already-linked' } as const
  }

  const ffprobeResult = await injector.getInstance(FfprobeService).getFfprobeForPiratFile(file)

  // Try extracting IMDB ID directly from ffprobe tags or sibling .nfo files
  const tagImdbId = extractImdbIdFromFfprobeTags(ffprobeResult.format?.tags)

  const driveDataSet = getDataSetFor(injector, Drive, 'letter')
  const drive = await driveDataSet.get(injector, driveLetter)

  let nfoFiles: string[] = []
  let nfoImdbId: string | undefined

  if (!tagImdbId && drive) {
    const physicalParent = getPhysicalParentPath(drive, file)
    const relativeParent = getParentPath(file)
    ;({ nfoFiles, imdbId: nfoImdbId } = await extractImdbIdFromNfoFiles(physicalParent, relativeParent))
  }

  const directImdbId = tagImdbId ?? nfoImdbId
  const relatedFiles: Array<{ type: 'subtitle' | 'audio' | 'trailer' | 'info' | 'other'; path: string }> = nfoFiles.map(
    (nfoPath) => ({ type: 'info' as const, path: nfoPath }),
  )

  if (directImdbId) {
    const movie = await ensureMovieExists(
      {
        imdbId: directImdbId,
        year,
        season,
        episode,
        type: season != null && episode != null ? 'episode' : 'movie',
      },
      injector,
    )

    const {
      created: [newMovieFile],
    } = await movieFileDataSet.add(injector, {
      driveLetter,
      path,
      imdbId: directImdbId,
      ffprobe: ffprobeResult,
      ...(relatedFiles.length > 0 ? { relatedFiles } : {}),
    })

    await logger.debug({
      message: `File ${fileName} linked successfully (from ${tagImdbId ? 'ffprobe tags' : '.nfo file'}).`,
      data: { file, movieFile: newMovieFile, movie, source: tagImdbId ? 'ffprobe-tags' : 'nfo-file' },
    })

    // Fire-and-forget: enrich localized metadata via providers
    void enrichMetadataFromProviders(injector, { title, year, season, episode }, { file }).catch((error) => {
      void logger.warning({
        message: `Failed to enrich metadata for '${fileName}' after direct-ID link`,
        data: { error },
      })
    })

    return { status: 'linked', movieFile: newMovieFile, movie } as const
  }

  // Check existing OMDB metadata (backward compatibility)
  const omdbDataSet = getDataSetFor(injector, OmdbMovieMetadata, 'imdbID')
  const storedResult = await omdbDataSet.find(injector, {
    filter: {
      Title: { $eq: title },
      ...(year ? { Year: { $eq: year.toString() } } : {}),
      ...(season ? { Season: { $eq: season.toString() } } : {}),
      ...(episode ? { Episode: { $eq: episode.toString() } } : {}),
    },
    top: 2,
  })

  if (storedResult.length > 1) {
    await logger.warning({
      message: `Multiple OMDB results found for '${fileName}', skipping.`,
      data: { file, title, year, count: storedResult.length },
    })
    return { status: 'failed' } as const
  }

  if (storedResult.length === 1) {
    const movie = await ensureMovieExists(
      {
        imdbId: storedResult[0].imdbID,
        year: parseInt(storedResult[0].Year, 10),
        season: storedResult[0].Season ? parseInt(storedResult[0].Season, 10) : undefined,
        episode: storedResult[0].Episode ? parseInt(storedResult[0].Episode, 10) : undefined,
        type: storedResult[0].Type,
        duration: storedResult[0].Runtime ? parseInt(storedResult[0].Runtime, 10) : undefined,
        seriesId: storedResult[0].seriesID,
      },
      injector,
    )
    await ensureMovieLocalizedMetadataExists(mapOmdbMovieToLocalized(storedResult[0]), injector)
    await ensureOmdbSeriesExists(storedResult[0], injector, { file })

    const {
      created: [newMovieFile],
    } = await movieFileDataSet.add(injector, {
      driveLetter,
      path,
      imdbId: storedResult[0].imdbID,
      ffprobe: ffprobeResult,
    })

    await logger.debug({
      message: `File ${fileName} linked successfully (from stored OMDB).`,
      data: { file, movieFile: newMovieFile, movie },
    })

    return { status: 'linked', movieFile: newMovieFile, movie } as const
  }

  // Try providers in priority order
  const priority = await getProviderPriority(injector)
  const providers: Record<string, typeof tryOmdbProvider> = {
    omdb: tryOmdbProvider,
    tmdb: tryTmdbProvider,
  }

  let linkedImdbId: string | undefined
  for (const provider of priority) {
    const tryProvider = providers[provider]
    if (!tryProvider) continue

    const result = await tryProvider(injector, { title, year, season, episode }, { file })

    if (result.status === 'skip') continue
    if (result.status === 'rate-limited') {
      await logger.warning({
        message: `${provider.toUpperCase()} rate limit reached while linking '${fileName}', skipping.`,
        data: { file, title, year },
      })
      return { status: 'rate-limited' } as const
    }
    if (result.status === 'linked') {
      linkedImdbId = result.imdbId
      break
    }
  }

  if (!linkedImdbId) {
    await logger.debug({
      message: `No metadata found for '${fileName}' from any provider.`,
      data: { file, title, year },
    })
    return { status: 'metadata-not-found' } as const
  }

  const {
    created: [newMovieFile],
  } = await movieFileDataSet.add(injector, {
    driveLetter,
    path,
    imdbId: linkedImdbId,
    ffprobe: ffprobeResult,
  })

  await logger.debug({
    message: `File ${fileName} linked successfully.`,
    data: { file, movieFile: newMovieFile },
  })

  return { status: 'linked', movieFile: newMovieFile, movie: { imdbId: linkedImdbId } } as const
}
