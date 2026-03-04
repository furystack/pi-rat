import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import {
  getFallbackMetadata,
  getFileName,
  isMovieFile,
  isSampleFile,
  MovieFile,
  OmdbMovieMetadata,
  type PiRatFile,
} from 'common'
import { FfprobeService } from '../../../ffprobe-service.js'
import { OmdbClientService } from '../metadata-services/omdb-client-service.js'
import { ensureMovieExists } from './ensure-movie-exists.js'
import { ensureOmdbMovieExists } from './ensure-omdb-movie-exists.js'
import { ensureOmdbSeriesExists } from './ensure-omdb-series-exists.js'

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
    const movie = await ensureMovieExists(storedResult[0], injector)
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
      message: `File ${fileName} linked successfully.`,
      data: { file, movieFile: newMovieFile, movie },
    })

    return { status: 'linked', movieFile: newMovieFile, movie } as const
  }

  const omdbClientService = injector.getInstance(OmdbClientService)
  const result = await omdbClientService.fetchOmdbMovieMetadata({ title, year, season, episode }, { file })

  if (result.status === 'rate-limited') {
    await logger.warning({
      message: `OMDB rate limit reached while linking '${fileName}', skipping.`,
      data: { file, title, year },
    })
    return { status: 'rate-limited' } as const
  }

  if (result.status === 'not-found') {
    await logger.debug({
      message: `No OMDB metadata found for '${fileName}'.`,
      data: { file, title, year },
    })
    return { status: 'metadata-not-found' } as const
  }

  if (result.status === 'not-configured') {
    await logger.warning({
      message: `OMDB service not configured, cannot link '${fileName}'.`,
      data: { file },
    })
    return { status: 'omdb-not-configured' } as const
  }

  if (result.status === 'error') {
    await logger.error({
      message: `OMDB error while linking '${fileName}'.`,
      data: { file, error: result.error },
    })
    return { status: 'omdb-error', error: result.error } as const
  }

  const added = await ensureOmdbMovieExists(result.data, injector)

  const movie = await ensureMovieExists(added, injector)
  await ensureOmdbSeriesExists(added, injector, { file })

  const {
    created: [newMovieFile],
  } = await movieFileDataSet.add(injector, {
    driveLetter,
    path,
    imdbId: added.imdbID,
    ffprobe: ffprobeResult,
  })

  await logger.debug({
    message: `File ${fileName} linked successfully.`,
    data: { file, movieFile: newMovieFile, movie },
  })

  return { status: 'linked', movieFile: newMovieFile, movie } as const
}
