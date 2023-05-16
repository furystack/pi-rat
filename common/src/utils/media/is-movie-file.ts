export const isMovieFile = (path: string) => {
  const pathToLower = path.toLowerCase()
  if (pathToLower.endsWith('.mkv') || pathToLower.endsWith('.webm') || pathToLower.endsWith('.avi')) {
    return true
  }
  return false
}
