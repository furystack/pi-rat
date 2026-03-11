const movieExtensions = ['.mkv', '.webm', '.avi', '.mp4', '.mov']

export const isMovieFile = (path: string) => {
  const pathToLower = path.toLowerCase()
  if (movieExtensions.some((extension) => pathToLower.endsWith(extension))) {
    return true
  }
  return false
}
