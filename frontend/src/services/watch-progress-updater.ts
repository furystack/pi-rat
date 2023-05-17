import type { Disposable } from '@furystack/utils'

type WatchProgressUpdaterSettings = {
  intervalMs: number
  videoElement: HTMLVideoElement
  onSave: (progress: number) => Promise<void>
  saveTresholdSeconds: number
}

export class WatchProgressUpdater implements Disposable {
  public async dispose() {
    clearInterval(this.interval)
    await this.update()
  }

  private lastSavedTimeSeconds = this.settings.videoElement.currentTime

  public async update() {
    const progress = this.settings.videoElement.currentTime
    if (Math.abs(progress - this.lastSavedTimeSeconds) >= this.settings.saveTresholdSeconds) {
      await this.settings.onSave(progress)
      this.lastSavedTimeSeconds = progress
    }
  }

  public readonly interval: ReturnType<typeof setInterval>

  constructor(public readonly settings: WatchProgressUpdaterSettings) {
    this.interval = setInterval(() => {
      this.update()
    }, this.settings.intervalMs)
  }
}
