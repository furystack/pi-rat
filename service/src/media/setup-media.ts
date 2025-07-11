import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'

import { Movie, MovieFile, OmdbMovieMetadata, OmdbSeriesMetadata, Series, WatchHistoryEntry } from 'common'

import { getCurrentUser, isAuthorized } from '@furystack/core'
import type { AuthorizationResult } from '@furystack/repository'
import { getRepository } from '@furystack/repository'
import { useSequelize } from '@furystack/sequelize-store'
import { DataTypes, Model } from 'sequelize'

import { authorizedOnly } from '../authorization/authorized-only.js'
import { withRole } from '../authorization/with-role.js'
import type { FfprobeResult } from '../ffprobe-service.js'
import { getDefaultDbSettings } from '../get-default-db-options.js'
import { OmdbClientService } from './metadata-services/omdb-client-service.js'
import { useMovieFileMaintainer } from './services/movie-file-maintainer.js'

class MovieModel extends Model<Movie, Movie> implements Movie {
  declare title: string
  declare imdbId: string
  declare year?: number | undefined
  declare duration?: number | undefined
  declare genre?: string[] | undefined
  declare thumbnailImageUrl?: string | undefined
  declare plot?: string | undefined
  declare type?: 'episode' | 'movie' | undefined
  declare seriesId?: string | undefined
  declare season?: number | undefined
  declare episode?: number | undefined
  declare createdAt: string
  declare updatedAt: string
}

class MovieFileModel extends Model<MovieFile, MovieFile> implements MovieFile {
  declare id: string
  declare imdbId?: string
  declare driveLetter: string
  declare path: string
  declare ffprobe: FfprobeResult
  declare relatedFiles?: Array<{ type: 'subtitle' | 'audio' | 'trailer' | 'info' | 'other'; path: string }> | undefined
}

class WatchHistoryEntryModel extends Model<WatchHistoryEntry, WatchHistoryEntry> implements WatchHistoryEntry {
  declare movieFileId: string
  declare driveLetter: string
  declare path: string
  declare id: string
  declare userName: string
  declare movie: Movie
  declare watchedSeconds: number
  declare completed: boolean
  declare createdAt: string
  declare updatedAt: string
}

class SeriesModel extends Model<Series, Series> implements Series {
  declare imdbId: string
  declare title: string
  declare year: string
  declare thumbnailImageUrl?: string | undefined
  declare plot: string
  declare createdAt: string
  declare updatedAt: string
}

class OmdbMovieMetadataModel extends Model<OmdbMovieMetadata, OmdbMovieMetadata> implements OmdbMovieMetadata {
  declare Title: string
  declare Year: string
  declare Rated: string
  declare Released: string
  declare Runtime: string
  declare Genre: string
  declare Director: string
  declare Writer: string
  declare Actors: string
  declare Plot: string
  declare Language: string
  declare Country: string
  declare Awards: string
  declare Poster: string
  declare Ratings: Array<{ Source: string; Value: string }>
  declare Metascore: string
  declare imdbRating: string
  declare imdbVotes: string
  declare imdbID: string
  declare Type: 'episode' | 'movie'
  declare DVD?: string | undefined
  declare BoxOffice?: string | undefined
  declare Production?: string | undefined
  declare Website?: string | undefined
  declare Response: 'True'
  declare seriesID?: string | undefined
  declare Season?: string | undefined
  declare Episode?: string | undefined
  declare createdAt: string
  declare updatedAt: string
}

class OmdbSeriesMetadataModel extends Model<OmdbSeriesMetadata, OmdbSeriesMetadata> implements OmdbSeriesMetadata {
  declare Title: string
  declare Year: string
  declare Rated: string
  declare Released: string
  declare Runtime: string
  declare Genre: string
  declare Director: string
  declare Writer: string
  declare Actors: string
  declare Plot: string
  declare Language: string
  declare Country: string
  declare Awards: string
  declare Poster: string
  declare Ratings: Array<{ Source: string; Value: string }>
  declare Metascore: string
  declare imdbRating: string
  declare imdbVotes: string
  declare imdbID: string
  declare Type: string
  declare totalSeasons: string
  declare Response: string
  declare createdAt: string
  declare updatedAt: string
}

export const setupMovies = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Movies')

  await logger.verbose({ message: '🎥  Setting up Media store and repository...' })

  const dbOptions = getDefaultDbSettings('movies.sqlite', logger)

  useSequelize({
    injector,
    model: Movie,
    sequelizeModel: MovieModel,
    primaryKey: 'imdbId',
    options: dbOptions,
    initModel: async (sequelize) => {
      MovieModel.init(
        {
          imdbId: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true,
          },
          title: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          year: {
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          genre: {
            type: DataTypes.JSON, //DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
          },
          episode: {
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          season: {
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          plot: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          thumbnailImageUrl: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          type: {
            type: DataTypes.ENUM('episode', 'movie'),
            allowNull: true,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          seriesId: {
            type: DataTypes.STRING,
            allowNull: true,
          },
        },
        { sequelize },
      )
    },
  })

  useSequelize({
    injector,
    model: MovieFile,
    sequelizeModel: MovieFileModel,
    primaryKey: 'id',
    options: dbOptions,
    initModel: async (sequelize) => {
      MovieFileModel.init(
        {
          id: {
            type: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
            defaultValue: () => crypto.randomUUID(),
          },
          imdbId: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          driveLetter: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          path: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          ffprobe: {
            type: DataTypes.JSON,
            allowNull: true,
          },
          relatedFiles: {
            type: DataTypes.JSON,
            allowNull: true,
          },
        },
        { sequelize, indexes: [{ fields: ['imdbId'] }, { fields: ['driveLetter', 'path'], unique: true }] },
      )

      // await MovieFileModel.sync()
    },
  })

  useSequelize({
    injector,
    model: WatchHistoryEntry,
    sequelizeModel: WatchHistoryEntryModel,
    primaryKey: 'id',
    options: dbOptions,
    initModel: async (sequelize) => {
      WatchHistoryEntryModel.init(
        {
          id: {
            type: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
            defaultValue: () => crypto.randomUUID(),
          },
          userName: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          driveLetter: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          path: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          watchedSeconds: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          completed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
        },
        {
          sequelize,
          indexes: [{ fields: ['userName', 'driveLetter', 'path'], unique: true }],
        },
      )
      // await WatchHistoryEntryModel.sync()
    },
  })

  useSequelize({
    injector,
    model: Series,
    sequelizeModel: SeriesModel,
    primaryKey: 'imdbId',
    options: dbOptions,
    initModel: async (sequelize) => {
      SeriesModel.init(
        {
          imdbId: {
            type: DataTypes.STRING,
            primaryKey: true,
          },
          title: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          year: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          thumbnailImageUrl: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          plot: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
        },
        { sequelize },
      )
      // await SeriesModel.sync()
    },
  })

  useSequelize({
    injector,
    model: OmdbMovieMetadata,
    sequelizeModel: OmdbMovieMetadataModel,
    primaryKey: 'imdbID',
    options: dbOptions,
    initModel: async (sequelize) => {
      OmdbMovieMetadataModel.init(
        {
          imdbID: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
          },
          Title: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Year: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Rated: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          Released: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          Runtime: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          Genre: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          Director: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          Writer: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          Actors: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          Plot: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Language: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          Country: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          Awards: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          Poster: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Ratings: {
            type: DataTypes.JSON,
            allowNull: true,
          },
          Metascore: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          imdbRating: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          imdbVotes: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          Response: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Type: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          DVD: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          BoxOffice: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          Production: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          Episode: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          Season: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          Website: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          seriesID: {
            type: DataTypes.STRING,
            allowNull: true,
          },
        },
        { sequelize },
      )
      // await OmdbMovieMetadataModel.sync()
    },
  })

  useSequelize({
    injector,
    model: OmdbSeriesMetadata,
    sequelizeModel: OmdbSeriesMetadataModel,
    primaryKey: 'imdbID',
    options: dbOptions,
    initModel: async (sequelize) => {
      OmdbSeriesMetadataModel.init(
        {
          imdbID: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
          },
          Title: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Actors: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Awards: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Country: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Director: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Genre: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          imdbRating: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          imdbVotes: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Language: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Plot: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Poster: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Metascore: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Rated: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Released: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Response: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Runtime: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Type: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Ratings: {
            type: DataTypes.JSON,
            allowNull: false,
          },
          totalSeasons: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Writer: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          Year: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
        },
        { sequelize },
      )
      // await OmdbSeriesMetadataModel.sync()
    },
  })

  const repo = getRepository(injector)

  repo.createDataSet(Movie, 'imdbId', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  repo.createDataSet(MovieFile, 'id', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  const onlyOwned = async ({
    entity,
    injector: i,
  }: {
    entity: WatchHistoryEntry
    injector: Injector
  }): Promise<AuthorizationResult> => {
    const user = await getCurrentUser(i)
    if (user.username === entity.userName) {
      return { isAllowed: true }
    }

    if (await isAuthorized(i, 'admin')) {
      return { isAllowed: true }
    }
    return {
      isAllowed: false,
      message: 'You are not authorized to access this resource',
    }
  }

  repo.createDataSet(WatchHistoryEntry, 'id', {
    authorizeGet: authorizedOnly,
    authorizeAdd: authorizedOnly,
    authorizeUpdate: authorizedOnly,
    authorizeRemove: authorizedOnly,
    authorizeGetEntity: onlyOwned,
    addFilter: async ({ filter, injector: i }) => {
      const user = await getCurrentUser(i)
      return {
        ...filter,
        filter: {
          ...filter.filter,
          userName: { $eq: user.username },
        },
      } as typeof filter
    },
    authorizeUpdateEntity: onlyOwned,
    authroizeRemoveEntity: onlyOwned,
  })

  repo.createDataSet(Series, 'imdbId', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  repo.createDataSet(OmdbMovieMetadata, 'imdbID', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  repo.createDataSet(OmdbSeriesMetadata, 'imdbID', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  injector.getInstance(OmdbClientService)

  useMovieFileMaintainer(injector)

  await logger.verbose({ message: '✅  Media setup completed' })
}
