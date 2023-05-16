import { sep } from 'path'
import { getFallbackMetadata } from './get-fallback-metadata'

describe('Get Fallback Metadata', () => {
  describe('title', () => {
    it('Should split by format', () => {
      const { title } = getFallbackMetadata('avengers.infinity.war.1080p.uhd-aaa.mkv')
      expect(title).toBe('avengers infinity war')
    })

    it('Should split by year', () => {
      const { title } = getFallbackMetadata('avengers.infinity.war.2018.720p.uhd-aaa.mkv')
      expect(title).toBe('avengers infinity war')
    })

    it('Should split season and episode', () => {
      const { title } = getFallbackMetadata('supernatural.S01E12.2018.720p.uhd-aaa.mkv')
      expect(title).toBe('supernatural')
    })
  })

  describe('year', () => {
    it('Should be retrieved', () => {
      const { year } = getFallbackMetadata('avengers.infinity.war.2018.720p.uhd-aaa.mkv')
      expect(year).toBe(2018)
    })
  })

  describe('type', () => {
    it('should be movie, if no SXXEYY segment has been found', () => {
      const { type } = getFallbackMetadata('avengers.infinity.war.1080p.uhd-aaa.mkv')
      expect(type).toBe('movie')
    })

    it('should be series, if SXXEYY segment has been found', () => {
      const { type } = getFallbackMetadata('supernatural.S01E12.2018.720p.uhd-aaa.mkv')
      expect(type).toBe('episode')
    })
  })

  describe('Scoring', () => {
    it('should return data from the folder name, if it has more score points', () => {
      const { title } = getFallbackMetadata(`avengers.infinity.war.1080p.uhd-aaa${sep}movie.mkv`)
      expect(title).toBe('avengers infinity war')
    })

    it('should return data from the file name, if it has more score points', () => {
      const { title } = getFallbackMetadata(`folderke${sep}avengers.infinity.war.1080p.uhd-aaa.mkv`)
      expect(title).toBe('avengers infinity war')
    })
  })
})
