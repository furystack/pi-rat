export class DeviceAwakeHistory {
  /**
   * Should be used as primary key
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
