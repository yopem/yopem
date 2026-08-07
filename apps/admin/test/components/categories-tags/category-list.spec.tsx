// @vitest-environment jsdom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vite-plus/test"

import { CategoryList } from "@/components/categories-tags/category-list"

;(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement | null = null
let root: Root | null = null

beforeEach(() => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  const currentRoot = root
  const currentContainer = container
  if (currentRoot && currentContainer) {
    act(() => currentRoot.unmount())
    document.body.removeChild(currentContainer)
  }
  container = null
  root = null
  vi.clearAllMocks()
})

describe("CategoryList", () => {
  const categories = [
    {
      id: "c1",
      name: "Smartphones",
      description: "Mobile phones",
      parentId: null,
      sortOrder: 1,
    },
    {
      id: "c2",
      name: "Android",
      description: "Android OS devices",
      parentId: "c1",
      sortOrder: 1,
    },
  ]

  test("renders category hierarchy, edit button, and delete dialog trigger", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()

    act(() => {
      root?.render(
        <CategoryList
          categories={categories}
          isLoading={false}
          selectedIds={[]}
          onToggleAll={() => undefined}
          onToggleItem={() => undefined}
          onEdit={onEdit}
          onDelete={onDelete}
          deleteMutation={{ isPending: false }}
        />,
      )
    })

    expect(container?.textContent).toContain("Smartphones")
    expect(container?.textContent).toContain("Android")

    const editButtons = container?.querySelectorAll("button")
    expect(editButtons?.length).toBeGreaterThanOrEqual(4)

    act(() => {
      ;(editButtons?.[0] as HTMLElement)?.click()
    })

    expect(onEdit).toHaveBeenCalledWith(categories[0])
  })
})
