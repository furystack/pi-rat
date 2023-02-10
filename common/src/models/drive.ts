export class Drive {
  /**
   * The physical path that will be mounted to the drive letter
   */
  physicalPath!: string

  /**
   * The drive letter, should be unique
   */
  letter!: string
  /**
   * The drive creation date
   *
   * @format date-time
   */
  createdAt!: string
  /**
   * Last update date
   *
   * @format date-time
   */
  updatedAt!: string
}
