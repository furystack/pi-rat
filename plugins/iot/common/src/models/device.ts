export class Device {
  /**
   * Should be used as primary key
   */
  public name!: string
  /**
   * Optional IP address, used to check availability with ping
   */
  public ipAddress?: string
  /**
   * Optional MAC address, used to awake the device with WOL
   */
  public macAddress?: string
  /**
   * Entry creation timestamp
   */
  public createdAt!: string
  /**
   * Entry update timestamp
   */
  public updatedAt!: string
}
