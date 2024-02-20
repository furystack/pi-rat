export class DevicePingHistory {
  /**
   * The device name
   */
  public name!: string
  /**
   * Flag that indicates if the device was available
   */
  public isAvailable!: boolean
  /**
   * Ping time in MS
   */
  public ping?: number
  /**
   * Entry creation timestamp
   */
  public createdAt!: string
}
