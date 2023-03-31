import { ResponseError } from '@furystack/rest-client-fetch'

export const getErrorMessage = async (error: unknown): Promise<string> => {
  if (error instanceof ResponseError) {
    try {
      const responseBody = await error.response.json()
      return responseBody.message?.toString() || error.toString()
    } catch {
      // failed to deserialize, fall back to error.toString()
    }
  }
  if (error instanceof Error) {
    return error.message
  }
  if (error instanceof Object) {
    return error.toString()
  }
  if (typeof error === 'string') {
    return error
  }
  return 'unknown error type'
}
