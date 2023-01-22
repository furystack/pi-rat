import type { CorsOptions } from '@furystack/rest-service'

/**
 *
 * @returns The CORS options to use service-wide
 */
export const getCorsOptions = (): CorsOptions => ({
  credentials: true,
  origins: ['http://localhost:8080'],
  headers: ['cache', 'content-type'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
})
