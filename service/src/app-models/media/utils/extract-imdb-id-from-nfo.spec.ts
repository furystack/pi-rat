import { describe, expect, it, vi } from 'vitest'
import { extractImdbIdFromNfoFiles } from './extract-imdb-id-from-nfo.js'

const mockReaddir = vi.fn()
const mockReadFile = vi.fn()

vi.mock('fs/promises', () => ({
  readdir: (...args: unknown[]) => mockReaddir(...args) as unknown,
  readFile: (...args: unknown[]) => mockReadFile(...args) as unknown,
}))

describe('extractImdbIdFromNfoFiles', () => {
  it('should return empty when directory cannot be read', async () => {
    mockReaddir.mockRejectedValue(new Error('ENOENT'))

    const result = await extractImdbIdFromNfoFiles('/mnt/media/movies', 'movies')

    expect(result).toEqual({ nfoFiles: [] })
  })

  it('should return empty when no .nfo files exist', async () => {
    mockReaddir.mockResolvedValue(['movie.mkv', 'movie.srt', 'readme.txt'])

    const result = await extractImdbIdFromNfoFiles('/mnt/media/movies', 'movies')

    expect(result).toEqual({ nfoFiles: [] })
  })

  it('should extract IMDB ID from .nfo file containing a plain ID', async () => {
    mockReaddir.mockResolvedValue(['movie.nfo', 'movie.mkv'])
    mockReadFile.mockResolvedValue('tt1234567')

    const result = await extractImdbIdFromNfoFiles('/mnt/media/movies', 'movies')

    expect(result.imdbId).toBe('tt1234567')
    expect(result.nfoFiles).toEqual(['movies/movie.nfo'])
  })

  it('should extract IMDB ID from .nfo file containing an IMDB URL', async () => {
    mockReaddir.mockResolvedValue(['movie.nfo'])
    mockReadFile.mockResolvedValue('https://www.imdb.com/title/tt9876543/')

    const result = await extractImdbIdFromNfoFiles('/mnt/media/movies', 'movies')

    expect(result.imdbId).toBe('tt9876543')
  })

  it('should extract IMDB ID from Kodi-style XML .nfo file', async () => {
    mockReaddir.mockResolvedValue(['movie.nfo'])
    mockReadFile.mockResolvedValue(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<movie>
  <title>Some Movie</title>
  <uniqueid type="imdb" default="true">tt7654321</uniqueid>
  <year>2024</year>
</movie>`)

    const result = await extractImdbIdFromNfoFiles('/mnt/media/movies', 'movies')

    expect(result.imdbId).toBe('tt7654321')
  })

  it('should handle .nfo files case-insensitively', async () => {
    mockReaddir.mockResolvedValue(['Movie.NFO'])
    mockReadFile.mockResolvedValue('tt1111111')

    const result = await extractImdbIdFromNfoFiles('/mnt/media/movies', 'movies')

    expect(result.imdbId).toBe('tt1111111')
    expect(result.nfoFiles).toEqual(['movies/Movie.NFO'])
  })

  it('should return nfoFiles without imdbId when .nfo has no IMDB ID', async () => {
    mockReaddir.mockResolvedValue(['movie.nfo'])
    mockReadFile.mockResolvedValue('Just some random text without any ID')

    const result = await extractImdbIdFromNfoFiles('/mnt/media/movies', 'movies')

    expect(result.imdbId).toBeUndefined()
    expect(result.nfoFiles).toEqual(['movies/movie.nfo'])
  })

  it('should skip unreadable .nfo files and try the next one', async () => {
    mockReaddir.mockResolvedValue(['broken.nfo', 'good.nfo'])
    mockReadFile.mockRejectedValueOnce(new Error('EACCES')).mockResolvedValueOnce('tt2222222')

    const result = await extractImdbIdFromNfoFiles('/mnt/media/movies', 'movies')

    expect(result.imdbId).toBe('tt2222222')
    expect(result.nfoFiles).toEqual(['movies/broken.nfo', 'movies/good.nfo'])
  })

  it('should return all nfo files even when all are unreadable', async () => {
    mockReaddir.mockResolvedValue(['a.nfo', 'b.nfo'])
    mockReadFile.mockRejectedValue(new Error('EACCES'))

    const result = await extractImdbIdFromNfoFiles('/mnt/media/movies', 'movies')

    expect(result.imdbId).toBeUndefined()
    expect(result.nfoFiles).toEqual(['movies/a.nfo', 'movies/b.nfo'])
  })

  it('should normalize backslashes in relatedFiles paths', async () => {
    mockReaddir.mockResolvedValue(['movie.nfo'])
    mockReadFile.mockResolvedValue('tt3333333')

    const result = await extractImdbIdFromNfoFiles('/mnt/media/movies/subdir', 'movies/subdir')

    expect(result.nfoFiles).toEqual(['movies/subdir/movie.nfo'])
  })

  it('should handle IDs with more than 7 digits', async () => {
    mockReaddir.mockResolvedValue(['movie.nfo'])
    mockReadFile.mockResolvedValue('tt12345678')

    const result = await extractImdbIdFromNfoFiles('/mnt/media/movies', 'movies')

    expect(result.imdbId).toBe('tt12345678')
  })
})
