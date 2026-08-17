export const stringifySearch = (search: Record<string, unknown>): string => {
  const parts: string[] = []
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined) continue
    const encodedKey = encodeURIComponent(key)
    if (Array.isArray(value)) {
      parts.push(`${encodedKey}=${value.map(encodeURIComponent).join(",")}`)
    } else if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      parts.push(`${encodedKey}=${encodeURIComponent(String(value))}`)
    }
  }
  return parts.length ? `?${parts.join("&")}` : ""
}

export const parseSearch = (searchStr: string): Record<string, unknown> => {
  if (searchStr.startsWith("?")) searchStr = searchStr.slice(1)
  const params = new URLSearchParams(searchStr)
  const result: Record<string, unknown> = {}
  for (const [key, value] of params.entries()) {
    result[key] = value.includes(",") ? value.split(",") : value
  }
  return result
}
