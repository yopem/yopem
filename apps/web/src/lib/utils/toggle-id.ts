export const toggleId = (ids: string[], id: string): string[] =>
  ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id]
