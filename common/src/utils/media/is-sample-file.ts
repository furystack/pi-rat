export const isSampleFile = (path: string) => {
  const segments = path.toLowerCase().split(/\/|\\/g)
  if (segments.includes('sample')) {
    return true
  }
  if (segments[segments.length - 1].includes('sample')) {
    return true
  }
  return false
}
