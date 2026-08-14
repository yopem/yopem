export const stringifySearch = (search: Record<string, unknown>): string => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item))
    } else {
      params.append(key, String(value))
    }
  }
  const str = params.toString()
  return str ? `?${str}` : ""
}

export const parseSearch = (searchStr: string): Record<string, unknown> => {
  if (searchStr.startsWith("?")) searchStr = searchStr.slice(1)
  const params = new URLSearchParams(searchStr)
  const result: Record<string, unknown> = {}
  for (const [key, value] of params.entries()) {
    const prev = result[key]
    if (prev === undefined) {
      result[key] = value
    } else if (Array.isArray(prev)) {
      prev.push(value)
    } else {
      result[key] = [prev, value]
    }
  }
  return result
}
