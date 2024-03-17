export class DeviceAwakeHistory {
  /**
   * The log entry id
   */
  public id!: string

  /**
   * The related device name
   */
  public name!: string
  /**
   * Flag that indicates if the package was successfully sent
   */
  public success!: boolean
  /**
   * Entry creation timestamp
   */
  public createdAt!: string
}
