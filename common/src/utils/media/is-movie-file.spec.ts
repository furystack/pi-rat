import { isMovieFile } from './is-movie-file.js'
import { describe, it, expect } from 'vitest'

describe('isMovieFile', () => {
  it('should indicate true if the extension is .mkv', () => {
    expect(isMovieFile('alma.mkv')).toBeTruthy()
  })

  it('should indicate true if the extension is .webm', () => {
    expect(isMovieFile('alma.webm')).toBeTruthy()
  })

  it('should indicate true if the extension is .avi', () => {
    expect(isMovieFile('alma.avi')).toBeTruthy()
  })

  it('should indicate true if the extension is .mp4', () => {
    expect(isMovieFile('alma.mp4')).toBeTruthy()
  })

  it('should indicate true if the extension is .mov', () => {
    expect(isMovieFile('alma.mov')).toBeTruthy()
  })

  it('should be case-insensitive', () => {
    expect(isMovieFile('alma.MKV')).toBeTruthy()
    expect(isMovieFile('alma.Mp4')).toBeTruthy()
  })

  it('should indicate false for unknown extensions', () => {
    expect(isMovieFile('alma.zip')).toBeFalsy()
  })
})
