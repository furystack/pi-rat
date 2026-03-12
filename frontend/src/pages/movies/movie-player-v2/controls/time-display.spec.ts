import { describe, expect, it } from 'vitest'
import { formatTime } from './time-display.js'

describe('formatTime', () => {
  it('should format zero seconds', () => {
    expect(formatTime(0)).toBe('0:00')
  })

  it('should format seconds under a minute', () => {
    expect(formatTime(45)).toBe('0:45')
  })

  it('should format minutes and seconds', () => {
    expect(formatTime(125)).toBe('2:05')
  })

  it('should format hours, minutes, and seconds', () => {
    expect(formatTime(3661)).toBe('1:01:01')
  })

  it('should pad minutes and seconds in hour format', () => {
    expect(formatTime(3600)).toBe('1:00:00')
  })

  it('should handle large durations', () => {
    expect(formatTime(36000)).toBe('10:00:00')
  })

  it('should return 0:00 for negative values', () => {
    expect(formatTime(-5)).toBe('0:00')
  })

  it('should return 0:00 for NaN', () => {
    expect(formatTime(NaN)).toBe('0:00')
  })

  it('should return 0:00 for Infinity', () => {
    expect(formatTime(Infinity)).toBe('0:00')
  })

  it('should floor fractional seconds', () => {
    expect(formatTime(90.7)).toBe('1:30')
  })
})
