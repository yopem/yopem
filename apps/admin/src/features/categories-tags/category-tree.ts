export interface CategoryTreeNode {
  id: string
  name: string
  description?: string | null
  parentId: string | null
  sortOrder: number | null
}

export function flattenCategoryTree(
  categories: CategoryTreeNode[],
): { node: CategoryTreeNode; depth: number }[] {
  const byParent = new Map<string | null, CategoryTreeNode[]>()

  for (const category of categories) {
    const key = category.parentId ?? null
    if (!byParent.has(key)) {
      byParent.set(key, [])
    }
    byParent.get(key)!.push(category)
  }

  const sortNodes = (nodes: CategoryTreeNode[]) =>
    nodes.sort((a, b) => {
      const orderA = a.sortOrder ?? 0
      const orderB = b.sortOrder ?? 0
      if (orderA !== orderB) return orderA - orderB
      return a.name.localeCompare(b.name)
    })

  const result: { node: CategoryTreeNode; depth: number }[] = []

  const walk = (nodes: CategoryTreeNode[], depth: number) => {
    for (const node of sortNodes(nodes)) {
      result.push({ node, depth })
      const children = byParent.get(node.id) ?? []
      if (children.length > 0) {
        walk(children, depth + 1)
      }
    }
  }

  const roots = byParent.get(null) ?? []
  walk(roots, 0)

  return result
}

export function getCategoryDescendantIds(
  categories: CategoryTreeNode[],
  id: string,
): string[] {
  const byParent = new Map<string, CategoryTreeNode[]>()

  for (const category of categories) {
    const key = category.parentId ?? null
    if (key === null) continue
    if (!byParent.has(key)) {
      byParent.set(key, [])
    }
    byParent.get(key)!.push(category)
  }

  const result: string[] = []
  const walk = (parentId: string) => {
    const children = byParent.get(parentId) ?? []
    for (const child of children) {
      result.push(child.id)
      walk(child.id)
    }
  }

  walk(id)
  return result
}
