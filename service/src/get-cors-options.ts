/**
 *
 * @returns The CORS options to use service-wide
 */
export const getCorsOptions = () => ({
  credentials: true,
  origins: ['http://localhost:8080'],
  headers: ['cache', 'content-type'],
})
