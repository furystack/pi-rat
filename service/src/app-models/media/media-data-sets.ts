import { getCurrentUser, isAuthorized } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { defineDataSet, type AuthorizationResult, type DataSetToken } from '@furystack/repository'
import { defineSequelizeStore } from '@furystack/sequelize-store'
import {
  Movie,
  MovieFile,
  MovieMetadataLocalized,
  OmdbMovieMetadata,
  OmdbSeriesMetadata,
  Series,
  SeriesMetadataLocalized,
  TmdbMovieMetadata,
  TmdbSeriesMetadata,
  WatchHistoryEntry,
} from 'common'
import { DataTypes } from 'sequelize'
import { authorizedOnly } from '../../authorization/authorized-only.js'
import { withRole } from '../../authorization/with-role.js'
import { getDefaultDbSettings } from '../../get-default-db-options.js'
import {
  MovieFileModel,
  MovieMetadataLocalizedModel,
  MovieModel,
  OmdbMovieMetadataModel,
  OmdbSeriesMetadataModel,
  SeriesMetadataLocalizedModel,
  SeriesModel,
  TmdbMovieMetadataModel,
  TmdbSeriesMetadataModel,
  WatchHistoryEntryModel,
} from './media-sequelize-models.js'

const dbOptions = getDefaultDbSettings('movies.sqlite')

export const MovieStore = defineSequelizeStore<Movie, MovieModel, 'imdbId'>({
  name: 'pi-rat/MovieStore',
  model: Movie,
  sequelizeModel: MovieModel,
  primaryKey: 'imdbId',
  options: dbOptions,
  initModel: async (sequelize) => {
    MovieModel.init(
      {
        imdbId: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
        duration: { type: DataTypes.INTEGER, allowNull: true },
        year: { type: DataTypes.INTEGER, allowNull: true },
        episode: { type: DataTypes.INTEGER, allowNull: true },
        season: { type: DataTypes.INTEGER, allowNull: true },
        type: { type: DataTypes.ENUM('episode', 'movie'), allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
        seriesId: { type: DataTypes.STRING, allowNull: true },
      },
      { sequelize },
    )
  },
})

export const MovieFileStore = defineSequelizeStore<MovieFile, MovieFileModel, 'id'>({
  name: 'pi-rat/MovieFileStore',
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
        imdbId: { type: DataTypes.STRING, allowNull: true },
        driveLetter: { type: DataTypes.STRING, allowNull: false },
        path: { type: DataTypes.STRING, allowNull: false },
        ffprobe: { type: DataTypes.JSON, allowNull: true },
        relatedFiles: { type: DataTypes.JSON, allowNull: true },
      },
      { sequelize, indexes: [{ fields: ['imdbId'] }, { fields: ['driveLetter', 'path'], unique: true }] },
    )
  },
})

export const WatchHistoryEntryStore = defineSequelizeStore<WatchHistoryEntry, WatchHistoryEntryModel, 'id'>({
  name: 'pi-rat/WatchHistoryEntryStore',
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
        userName: { type: DataTypes.STRING, allowNull: false },
        driveLetter: { type: DataTypes.STRING, allowNull: false },
        path: { type: DataTypes.STRING, allowNull: false },
        watchedSeconds: { type: DataTypes.INTEGER, allowNull: false },
        completed: { type: DataTypes.BOOLEAN, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
      },
      { sequelize, indexes: [{ fields: ['userName', 'driveLetter', 'path'], unique: true }] },
    )
  },
})

export const SeriesStore = defineSequelizeStore<Series, SeriesModel, 'imdbId'>({
  name: 'pi-rat/SeriesStore',
  model: Series,
  sequelizeModel: SeriesModel,
  primaryKey: 'imdbId',
  options: dbOptions,
  initModel: async (sequelize) => {
    SeriesModel.init(
      {
        imdbId: { type: DataTypes.STRING, primaryKey: true },
        year: { type: DataTypes.STRING, allowNull: false },
        numberOfSeasons: { type: DataTypes.INTEGER, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
      },
      { sequelize },
    )
  },
})

export const OmdbMovieMetadataStore = defineSequelizeStore<OmdbMovieMetadata, OmdbMovieMetadataModel, 'imdbID'>({
  name: 'pi-rat/OmdbMovieMetadataStore',
  model: OmdbMovieMetadata,
  sequelizeModel: OmdbMovieMetadataModel,
  primaryKey: 'imdbID',
  options: dbOptions,
  initModel: async (sequelize) => {
    OmdbMovieMetadataModel.init(
      {
        imdbID: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
        Title: { type: DataTypes.STRING, allowNull: false },
        Year: { type: DataTypes.STRING, allowNull: false },
        Rated: { type: DataTypes.STRING, allowNull: true },
        Released: { type: DataTypes.STRING, allowNull: true },
        Runtime: { type: DataTypes.STRING, allowNull: true },
        Genre: { type: DataTypes.STRING, allowNull: true },
        Director: { type: DataTypes.STRING, allowNull: true },
        Writer: { type: DataTypes.STRING, allowNull: true },
        Actors: { type: DataTypes.STRING, allowNull: true },
        Plot: { type: DataTypes.STRING, allowNull: false },
        Language: { type: DataTypes.STRING, allowNull: true },
        Country: { type: DataTypes.STRING, allowNull: true },
        Awards: { type: DataTypes.STRING, allowNull: true },
        Poster: { type: DataTypes.STRING, allowNull: false },
        Ratings: { type: DataTypes.JSON, allowNull: true },
        Metascore: { type: DataTypes.STRING, allowNull: true },
        imdbRating: { type: DataTypes.STRING, allowNull: true },
        imdbVotes: { type: DataTypes.STRING, allowNull: true },
        Response: { type: DataTypes.STRING, allowNull: false },
        Type: { type: DataTypes.STRING, allowNull: false },
        DVD: { type: DataTypes.STRING, allowNull: true },
        BoxOffice: { type: DataTypes.STRING, allowNull: true },
        Production: { type: DataTypes.STRING, allowNull: true },
        Episode: { type: DataTypes.STRING, allowNull: true },
        Season: { type: DataTypes.STRING, allowNull: true },
        Website: { type: DataTypes.STRING, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
        seriesID: { type: DataTypes.STRING, allowNull: true },
      },
      { sequelize },
    )
  },
})

export const OmdbSeriesMetadataStore = defineSequelizeStore<OmdbSeriesMetadata, OmdbSeriesMetadataModel, 'imdbID'>({
  name: 'pi-rat/OmdbSeriesMetadataStore',
  model: OmdbSeriesMetadata,
  sequelizeModel: OmdbSeriesMetadataModel,
  primaryKey: 'imdbID',
  options: dbOptions,
  initModel: async (sequelize) => {
    OmdbSeriesMetadataModel.init(
      {
        imdbID: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
        Title: { type: DataTypes.STRING, allowNull: false },
        Actors: { type: DataTypes.STRING, allowNull: false },
        Awards: { type: DataTypes.STRING, allowNull: false },
        Country: { type: DataTypes.STRING, allowNull: false },
        Director: { type: DataTypes.STRING, allowNull: false },
        Genre: { type: DataTypes.STRING, allowNull: false },
        imdbRating: { type: DataTypes.STRING, allowNull: false },
        imdbVotes: { type: DataTypes.STRING, allowNull: false },
        Language: { type: DataTypes.STRING, allowNull: false },
        Plot: { type: DataTypes.STRING, allowNull: false },
        Poster: { type: DataTypes.STRING, allowNull: false },
        Metascore: { type: DataTypes.STRING, allowNull: false },
        Rated: { type: DataTypes.STRING, allowNull: false },
        Released: { type: DataTypes.STRING, allowNull: false },
        Response: { type: DataTypes.STRING, allowNull: false },
        Runtime: { type: DataTypes.STRING, allowNull: false },
        Type: { type: DataTypes.STRING, allowNull: false },
        Ratings: { type: DataTypes.JSON, allowNull: false },
        totalSeasons: { type: DataTypes.STRING, allowNull: false },
        Writer: { type: DataTypes.STRING, allowNull: false },
        Year: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
      },
      { sequelize },
    )
  },
})

export const TmdbMovieMetadataStore = defineSequelizeStore<TmdbMovieMetadata, TmdbMovieMetadataModel, 'id'>({
  name: 'pi-rat/TmdbMovieMetadataStore',
  model: TmdbMovieMetadata,
  sequelizeModel: TmdbMovieMetadataModel,
  primaryKey: 'id',
  options: dbOptions,
  initModel: async (sequelize) => {
    TmdbMovieMetadataModel.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
        imdbId: { type: DataTypes.STRING, allowNull: true },
        title: { type: DataTypes.STRING, allowNull: false },
        originalTitle: { type: DataTypes.STRING, allowNull: false },
        overview: { type: DataTypes.TEXT, allowNull: false },
        releaseDate: { type: DataTypes.STRING, allowNull: true },
        runtime: { type: DataTypes.INTEGER, allowNull: true },
        posterPath: { type: DataTypes.STRING, allowNull: true },
        backdropPath: { type: DataTypes.STRING, allowNull: true },
        genres: { type: DataTypes.JSON, allowNull: true },
        voteAverage: { type: DataTypes.FLOAT, allowNull: true },
        voteCount: { type: DataTypes.INTEGER, allowNull: true },
        popularity: { type: DataTypes.FLOAT, allowNull: true },
        originalLanguage: { type: DataTypes.STRING, allowNull: false },
        spokenLanguages: { type: DataTypes.JSON, allowNull: true },
        productionCountries: { type: DataTypes.JSON, allowNull: true },
        status: { type: DataTypes.STRING, allowNull: true },
        tagline: { type: DataTypes.STRING, allowNull: true },
        budget: { type: DataTypes.INTEGER, allowNull: true },
        revenue: { type: DataTypes.INTEGER, allowNull: true },
        language: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
      },
      { sequelize, indexes: [{ fields: ['imdbId'] }] },
    )
  },
})

export const TmdbSeriesMetadataStore = defineSequelizeStore<TmdbSeriesMetadata, TmdbSeriesMetadataModel, 'id'>({
  name: 'pi-rat/TmdbSeriesMetadataStore',
  model: TmdbSeriesMetadata,
  sequelizeModel: TmdbSeriesMetadataModel,
  primaryKey: 'id',
  options: dbOptions,
  initModel: async (sequelize) => {
    TmdbSeriesMetadataModel.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
        imdbId: { type: DataTypes.STRING, allowNull: true },
        name: { type: DataTypes.STRING, allowNull: false },
        originalName: { type: DataTypes.STRING, allowNull: false },
        overview: { type: DataTypes.TEXT, allowNull: false },
        firstAirDate: { type: DataTypes.STRING, allowNull: true },
        posterPath: { type: DataTypes.STRING, allowNull: true },
        backdropPath: { type: DataTypes.STRING, allowNull: true },
        genres: { type: DataTypes.JSON, allowNull: true },
        voteAverage: { type: DataTypes.FLOAT, allowNull: true },
        voteCount: { type: DataTypes.INTEGER, allowNull: true },
        numberOfSeasons: { type: DataTypes.INTEGER, allowNull: true },
        numberOfEpisodes: { type: DataTypes.INTEGER, allowNull: true },
        status: { type: DataTypes.STRING, allowNull: true },
        originalLanguage: { type: DataTypes.STRING, allowNull: false },
        languages: { type: DataTypes.JSON, allowNull: true },
        language: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
      },
      { sequelize, indexes: [{ fields: ['imdbId'] }] },
    )
  },
})

export const MovieMetadataLocalizedStore = defineSequelizeStore<
  MovieMetadataLocalized,
  MovieMetadataLocalizedModel,
  'id'
>({
  name: 'pi-rat/MovieMetadataLocalizedStore',
  model: MovieMetadataLocalized,
  sequelizeModel: MovieMetadataLocalizedModel,
  primaryKey: 'id',
  options: dbOptions,
  initModel: async (sequelize) => {
    MovieMetadataLocalizedModel.init(
      {
        id: {
          type: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
          defaultValue: () => crypto.randomUUID(),
        },
        movieImdbId: { type: DataTypes.STRING, allowNull: false },
        language: { type: DataTypes.STRING, allowNull: false },
        title: { type: DataTypes.STRING, allowNull: false },
        plot: { type: DataTypes.TEXT, allowNull: true },
        posterUrl: { type: DataTypes.STRING, allowNull: true },
        genre: { type: DataTypes.JSON, allowNull: true },
        source: { type: DataTypes.STRING, allowNull: false },
        sourceId: { type: DataTypes.STRING, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
      },
      {
        sequelize,
        indexes: [{ fields: ['movieImdbId'] }, { fields: ['movieImdbId', 'language', 'source'], unique: true }],
      },
    )
  },
})

export const SeriesMetadataLocalizedStore = defineSequelizeStore<
  SeriesMetadataLocalized,
  SeriesMetadataLocalizedModel,
  'id'
>({
  name: 'pi-rat/SeriesMetadataLocalizedStore',
  model: SeriesMetadataLocalized,
  sequelizeModel: SeriesMetadataLocalizedModel,
  primaryKey: 'id',
  options: dbOptions,
  initModel: async (sequelize) => {
    SeriesMetadataLocalizedModel.init(
      {
        id: {
          type: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
          defaultValue: () => crypto.randomUUID(),
        },
        seriesImdbId: { type: DataTypes.STRING, allowNull: false },
        language: { type: DataTypes.STRING, allowNull: false },
        title: { type: DataTypes.STRING, allowNull: false },
        plot: { type: DataTypes.TEXT, allowNull: true },
        posterUrl: { type: DataTypes.STRING, allowNull: true },
        source: { type: DataTypes.STRING, allowNull: false },
        sourceId: { type: DataTypes.STRING, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
      },
      {
        sequelize,
        indexes: [{ fields: ['seriesImdbId'] }, { fields: ['seriesImdbId', 'language', 'source'], unique: true }],
      },
    )
  },
})

const adminAuth = {
  authorizeGet: authorizedOnly,
  authorizeAdd: withRole('admin'),
  authorizeUpdate: withRole('admin'),
  authorizeRemove: withRole('admin'),
}

export const MovieDataSet: DataSetToken<Movie, 'imdbId'> = defineDataSet({
  name: 'pi-rat/MovieDataSet',
  store: MovieStore,
  settings: adminAuth,
})

export const MovieFileDataSet: DataSetToken<MovieFile, 'id'> = defineDataSet({
  name: 'pi-rat/MovieFileDataSet',
  store: MovieFileStore,
  settings: adminAuth,
})

export const SeriesDataSet: DataSetToken<Series, 'imdbId'> = defineDataSet({
  name: 'pi-rat/SeriesDataSet',
  store: SeriesStore,
  settings: adminAuth,
})

export const OmdbMovieMetadataDataSet: DataSetToken<OmdbMovieMetadata, 'imdbID'> = defineDataSet({
  name: 'pi-rat/OmdbMovieMetadataDataSet',
  store: OmdbMovieMetadataStore,
  settings: adminAuth,
})

export const OmdbSeriesMetadataDataSet: DataSetToken<OmdbSeriesMetadata, 'imdbID'> = defineDataSet({
  name: 'pi-rat/OmdbSeriesMetadataDataSet',
  store: OmdbSeriesMetadataStore,
  settings: adminAuth,
})

export const TmdbMovieMetadataDataSet: DataSetToken<TmdbMovieMetadata, 'id'> = defineDataSet({
  name: 'pi-rat/TmdbMovieMetadataDataSet',
  store: TmdbMovieMetadataStore,
  settings: adminAuth,
})

export const TmdbSeriesMetadataDataSet: DataSetToken<TmdbSeriesMetadata, 'id'> = defineDataSet({
  name: 'pi-rat/TmdbSeriesMetadataDataSet',
  store: TmdbSeriesMetadataStore,
  settings: adminAuth,
})

export const MovieMetadataLocalizedDataSet: DataSetToken<MovieMetadataLocalized, 'id'> = defineDataSet({
  name: 'pi-rat/MovieMetadataLocalizedDataSet',
  store: MovieMetadataLocalizedStore,
  settings: adminAuth,
})

export const SeriesMetadataLocalizedDataSet: DataSetToken<SeriesMetadataLocalized, 'id'> = defineDataSet({
  name: 'pi-rat/SeriesMetadataLocalizedDataSet',
  store: SeriesMetadataLocalizedStore,
  settings: adminAuth,
})

const onlyOwnedWatchHistory = async ({
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
  return { isAllowed: false, message: 'You are not authorized to access this resource' }
}

export const WatchHistoryEntryDataSet: DataSetToken<WatchHistoryEntry, 'id'> = defineDataSet({
  name: 'pi-rat/WatchHistoryEntryDataSet',
  store: WatchHistoryEntryStore,
  settings: {
    authorizeGet: authorizedOnly,
    authorizeAdd: authorizedOnly,
    authorizeUpdate: authorizedOnly,
    authorizeRemove: authorizedOnly,
    authorizeGetEntity: onlyOwnedWatchHistory,
    addFilter: async ({ filter, injector: i }) => {
      const user = await getCurrentUser(i)
      return {
        ...filter,
        filter: {
          ...filter.filter,
          userName: { $eq: user.username },
        },
      }
    },
    authorizeUpdateEntity: onlyOwnedWatchHistory,
    authorizeRemoveEntity: onlyOwnedWatchHistory,
  },
})

export const setupMediaStores = (injector: Injector): void => {
  // Resolving a DataSetToken cascades to its backing store, so we only need
  // to touch the dataset tokens to wire the full chain.
  injector.get(MovieDataSet)
  injector.get(MovieFileDataSet)
  injector.get(WatchHistoryEntryDataSet)
  injector.get(SeriesDataSet)
  injector.get(OmdbMovieMetadataDataSet)
  injector.get(OmdbSeriesMetadataDataSet)
  injector.get(TmdbMovieMetadataDataSet)
  injector.get(TmdbSeriesMetadataDataSet)
  injector.get(MovieMetadataLocalizedDataSet)
  injector.get(SeriesMetadataLocalizedDataSet)
}
