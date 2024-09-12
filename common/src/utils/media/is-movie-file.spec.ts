import { isMovieFile } from './is-movie-file.js'
import { describe, it, expect } from 'vitest'

describe('isMovieFile', () => {
  it('should indicate true if the extension is .mkv', () => {
    expect(isMovieFile('alma.mkv')).toBeTruthy()
  })

  it('should indicate true if the extension is .webm', () => {
    expect(isMovieFile('alma.webm')).toBeTruthy()
  })

  it('should indicate false for unknown extensions', () => {
    expect(isMovieFile('alma.zip')).toBeFalsy()
  })
})
