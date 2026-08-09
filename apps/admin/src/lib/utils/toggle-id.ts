export const toggleId = (ids: string[], id: string): string[] =>
  ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id]

export const toggleAllIds = (
  ids: string[],
  visibleIds: string[],
  allSelected: boolean,
): string[] =>
  allSelected
    ? ids.filter((id) => !visibleIds.includes(id))
    : Array.from(new Set([...ids, ...visibleIds]))
