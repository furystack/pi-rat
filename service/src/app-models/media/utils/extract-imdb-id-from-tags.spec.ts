import { describe, expect, it } from 'vitest'
import { extractImdbIdFromFfprobeTags } from './extract-imdb-id-from-tags.js'

describe('extractImdbIdFromFfprobeTags', () => {
  it('should return undefined for null tags', () => {
    expect(extractImdbIdFromFfprobeTags(null)).toBeUndefined()
  })

  it('should return undefined for undefined tags', () => {
    expect(extractImdbIdFromFfprobeTags(undefined)).toBeUndefined()
  })

  it('should return undefined for non-object tags', () => {
    expect(extractImdbIdFromFfprobeTags('string')).toBeUndefined()
    expect(extractImdbIdFromFfprobeTags(42)).toBeUndefined()
    expect(extractImdbIdFromFfprobeTags(true)).toBeUndefined()
  })

  it('should return undefined for empty object', () => {
    expect(extractImdbIdFromFfprobeTags({})).toBeUndefined()
  })

  it('should return undefined when no IMDB-related keys exist', () => {
    expect(extractImdbIdFromFfprobeTags({ title: 'Some Movie', year: '2024' })).toBeUndefined()
  })

  it('should extract from "IMDB" key', () => {
    expect(extractImdbIdFromFfprobeTags({ IMDB: 'tt1234567' })).toBe('tt1234567')
  })

  it('should extract from "imdb" key (lowercase)', () => {
    expect(extractImdbIdFromFfprobeTags({ imdb: 'tt1234567' })).toBe('tt1234567')
  })

  it('should extract from "IMDb" key (mixed case)', () => {
    expect(extractImdbIdFromFfprobeTags({ IMDb: 'tt1234567' })).toBe('tt1234567')
  })

  it('should extract from "IMDB_ID" key', () => {
    expect(extractImdbIdFromFfprobeTags({ IMDB_ID: 'tt1234567' })).toBe('tt1234567')
  })

  it('should extract from "imdb_id" key (lowercase)', () => {
    expect(extractImdbIdFromFfprobeTags({ imdb_id: 'tt1234567' })).toBe('tt1234567')
  })

  it('should extract from "imdb-id" key (hyphenated)', () => {
    expect(extractImdbIdFromFfprobeTags({ 'imdb-id': 'tt1234567' })).toBe('tt1234567')
  })

  it('should extract from "IMDBID" key (no separator)', () => {
    expect(extractImdbIdFromFfprobeTags({ IMDBID: 'tt1234567' })).toBe('tt1234567')
  })

  it('should handle IDs with more than 7 digits', () => {
    expect(extractImdbIdFromFfprobeTags({ IMDB: 'tt12345678' })).toBe('tt12345678')
  })

  it('should trim whitespace from values', () => {
    expect(extractImdbIdFromFfprobeTags({ IMDB: '  tt1234567  ' })).toBe('tt1234567')
  })

  it('should return undefined for invalid IMDB ID format', () => {
    expect(extractImdbIdFromFfprobeTags({ IMDB: 'not-an-id' })).toBeUndefined()
    expect(extractImdbIdFromFfprobeTags({ IMDB: '1234567' })).toBeUndefined()
    expect(extractImdbIdFromFfprobeTags({ IMDB: 'tt123' })).toBeUndefined()
    expect(extractImdbIdFromFfprobeTags({ IMDB: '' })).toBeUndefined()
  })

  it('should return undefined for IMDB ID embedded in a URL', () => {
    expect(extractImdbIdFromFfprobeTags({ IMDB: 'https://www.imdb.com/title/tt1234567/' })).toBeUndefined()
  })

  it('should ignore unrelated keys even when they contain numbers', () => {
    expect(extractImdbIdFromFfprobeTags({ encoder: 'Lavf58.76.100', duration: '7200' })).toBeUndefined()
  })
})
