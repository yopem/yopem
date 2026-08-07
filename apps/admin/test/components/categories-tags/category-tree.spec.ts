import { describe, expect, test } from "vite-plus/test"

import {
  flattenCategoryTree,
  getCategoryDescendantIds,
  type CategoryTreeNode,
} from "@/components/categories-tags/category-tree"

describe("category-tree utils", () => {
  const categories: CategoryTreeNode[] = [
    { id: "root1", name: "Electronics", parentId: null, sortOrder: 1 },
    { id: "sub1", name: "Phones", parentId: "root1", sortOrder: 2 },
    { id: "sub2", name: "Laptops", parentId: "root1", sortOrder: 1 },
    { id: "child1", name: "MacBooks", parentId: "sub2", sortOrder: 1 },
    { id: "root2", name: "Apparel", parentId: null, sortOrder: 2 },
  ]

  test("flattenCategoryTree flattens tree in correct depth order", () => {
    const flattened = flattenCategoryTree(categories)

    expect(flattened.map((f) => ({ id: f.node.id, depth: f.depth }))).toEqual([
      { id: "root1", depth: 0 },
      { id: "sub2", depth: 1 },
      { id: "child1", depth: 2 },
      { id: "sub1", depth: 1 },
      { id: "root2", depth: 0 },
    ])
  })

  test("getCategoryDescendantIds returns all nested children IDs recursively", () => {
    const descendants = getCategoryDescendantIds(categories, "root1")
    expect(descendants).toEqual(["sub1", "sub2", "child1"])

    const laptopDescendants = getCategoryDescendantIds(categories, "sub2")
    expect(laptopDescendants).toEqual(["child1"])

    const leafDescendants = getCategoryDescendantIds(categories, "child1")
    expect(leafDescendants).toEqual([])
  })
})
