import type { Movie } from './movie'
import type { MovieLibrary } from './movie-library'

export class EncodingTask {
  _id!: string
  authToken!: string
  /**
   * Generic info about the media to encode
   */
  mediaInfo!: {
    /**
     * The Movie entity
     */
    movie: Movie
    /**
     * The related movie library
     */
    library: MovieLibrary
  }
  /**
   * The current status of the task
   */
  status!: 'pending' | 'inProgress' | 'finished' | 'failed' | 'cancelled'
  /**
   * Generic info about the worker who works on the task
   */
  workerInfo?: {
    /**
     * The IP address
     */
    ip: string
  }
  /**
   * Shows how the progress of the encoding goes, reported by the worker agent
   */
  percent!: number
  /**
   * The task creation date
   */
  creationDate!: Date
  modificationDate?: Date
  error?: any
  log?: Array<{ timestamp: string; message: string }>
  startDate?: Date
  finishDate?: Date
}
