export interface IotConfig {
  id: 'IOT_CONFIG'
  value: {
    /**
     * The interval in milliseconds at which to ping all IOT devices to check their availability. Defaults to 120000 (2 minutes).
     */
    pingIntervalMs: number

    /**
     * The timeout in milliseconds for each ping request. Defaults to 3000 (3 second).
     */
    pingTimeoutMs: number
  }
}
