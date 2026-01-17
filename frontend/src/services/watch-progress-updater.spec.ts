import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WatchProgressUpdater } from './watch-progress-updater.js'

describe('WatchProgressUpdater', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createMockVideoElement = (currentTime = 0): HTMLVideoElement => {
    return {
      currentTime,
    } as HTMLVideoElement
  }

  describe('constructor', () => {
    it('should set up interval with specified intervalMs', () => {
      const videoElement = createMockVideoElement()
      const onSave = vi.fn().mockResolvedValue(undefined)

      const updater = new WatchProgressUpdater({
        intervalMs: 1000,
        videoElement,
        onSave,
        saveTresholdSeconds: 10,
      })

      expect(updater.interval).toBeDefined()

      clearInterval(updater.interval)
    })

    it('should initialize lastSavedTimeSeconds with video currentTime', async () => {
      const videoElement = createMockVideoElement(50)
      const onSave = vi.fn().mockResolvedValue(undefined)

      const updater = new WatchProgressUpdater({
        intervalMs: 1000,
        videoElement,
        onSave,
        saveTresholdSeconds: 10,
      })

      // Progress hasn't changed enough, so onSave should not be called
      await updater.update()
      expect(onSave).not.toHaveBeenCalled()

      clearInterval(updater.interval)
    })
  })

  describe('update', () => {
    it('should call onSave when progress exceeds threshold', async () => {
      const videoElement = createMockVideoElement(0)
      const onSave = vi.fn().mockResolvedValue(undefined)

      const updater = new WatchProgressUpdater({
        intervalMs: 1000,
        videoElement,
        onSave,
        saveTresholdSeconds: 10,
      })

      // Change video time beyond threshold
      videoElement.currentTime = 15

      await updater.update()

      expect(onSave).toHaveBeenCalledWith(15)

      clearInterval(updater.interval)
    })

    it('should not call onSave when progress is below threshold', async () => {
      const videoElement = createMockVideoElement(0)
      const onSave = vi.fn().mockResolvedValue(undefined)

      const updater = new WatchProgressUpdater({
        intervalMs: 1000,
        videoElement,
        onSave,
        saveTresholdSeconds: 10,
      })

      // Change video time but below threshold
      videoElement.currentTime = 5

      await updater.update()

      expect(onSave).not.toHaveBeenCalled()

      clearInterval(updater.interval)
    })

    it('should call onSave when rewinding past threshold', async () => {
      const videoElement = createMockVideoElement(100)
      const onSave = vi.fn().mockResolvedValue(undefined)

      const updater = new WatchProgressUpdater({
        intervalMs: 1000,
        videoElement,
        onSave,
        saveTresholdSeconds: 10,
      })

      // Rewind video beyond threshold
      videoElement.currentTime = 50

      await updater.update()

      expect(onSave).toHaveBeenCalledWith(50)

      clearInterval(updater.interval)
    })

    it('should update lastSavedTimeSeconds after saving', async () => {
      const videoElement = createMockVideoElement(0)
      const onSave = vi.fn().mockResolvedValue(undefined)

      const updater = new WatchProgressUpdater({
        intervalMs: 1000,
        videoElement,
        onSave,
        saveTresholdSeconds: 10,
      })

      // First update past threshold
      videoElement.currentTime = 15
      await updater.update()
      expect(onSave).toHaveBeenCalledTimes(1)

      // Second update not past threshold from new position
      videoElement.currentTime = 20
      await updater.update()
      expect(onSave).not.toHaveBeenCalledTimes(2)

      // Third update past threshold from new position
      videoElement.currentTime = 30
      await updater.update()
      expect(onSave).toHaveBeenCalledTimes(2)

      clearInterval(updater.interval)
    })
  })

  describe('interval', () => {
    it('should call update on interval', async () => {
      const videoElement = createMockVideoElement(0)
      const onSave = vi.fn().mockResolvedValue(undefined)

      const updater = new WatchProgressUpdater({
        intervalMs: 1000,
        videoElement,
        onSave,
        saveTresholdSeconds: 10,
      })

      // Set video time beyond threshold
      videoElement.currentTime = 15

      // Advance timer by one interval
      await vi.advanceTimersByTimeAsync(1000)

      expect(onSave).toHaveBeenCalled()

      clearInterval(updater.interval)
    })

    it('should call update multiple times on multiple intervals', async () => {
      const videoElement = createMockVideoElement(0)
      const onSave = vi.fn().mockResolvedValue(undefined)

      const updater = new WatchProgressUpdater({
        intervalMs: 1000,
        videoElement,
        onSave,
        saveTresholdSeconds: 5,
      })

      // First interval - progress to 10
      videoElement.currentTime = 10
      await vi.advanceTimersByTimeAsync(1000)
      expect(onSave).toHaveBeenCalledTimes(1)

      // Second interval - progress to 20
      videoElement.currentTime = 20
      await vi.advanceTimersByTimeAsync(1000)
      expect(onSave).toHaveBeenCalledTimes(2)

      clearInterval(updater.interval)
    })
  })

  describe('asyncDispose', () => {
    it('should clear interval and call final update on dispose', async () => {
      const videoElement = createMockVideoElement(0)
      const onSave = vi.fn().mockResolvedValue(undefined)

      const updater = new WatchProgressUpdater({
        intervalMs: 1000,
        videoElement,
        onSave,
        saveTresholdSeconds: 10,
      })

      // Set video time beyond threshold
      videoElement.currentTime = 25

      await updater[Symbol.asyncDispose]()

      // Final update should be called
      expect(onSave).toHaveBeenCalledWith(25)

      // Interval should be cleared - advancing time should not trigger more calls
      videoElement.currentTime = 50
      await vi.advanceTimersByTimeAsync(2000)
      expect(onSave).toHaveBeenCalledTimes(1)
    })
  })
})
