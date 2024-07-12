type WatchProgressUpdaterSettings = {
  intervalMs: number
  videoElement: HTMLVideoElement
  onSave: (progress: number) => Promise<void>
  saveTresholdSeconds: number
}

export class WatchProgressUpdater implements AsyncDisposable {
  public async [Symbol.asyncDispose]() {
    clearInterval(this.interval)
    await this.update()
  }

  private lastSavedTimeSeconds: number

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
    this.lastSavedTimeSeconds = this.settings.videoElement.currentTime
  }
}
