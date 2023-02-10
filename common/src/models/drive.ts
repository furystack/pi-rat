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
   */
  createdAt!: string
  /**
   * Last update date
   */
  updatedAt!: string
}
