const INVALID_IMAGE_SRC_PREFIXES = ["file:", "blob:", "/tmp/", "/private/tmp/"]

export function isRemoteImageSrc(src: string): boolean {
  const lower = src.toLowerCase()
  return !INVALID_IMAGE_SRC_PREFIXES.some((prefix) => lower.startsWith(prefix))
}
