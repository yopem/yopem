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

import { CategoryDialog } from "@/features/categories-tags/category-dialog"

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

describe("CategoryDialog", () => {
  const categories = [
    { id: "cat1", name: "Hardware", parentId: null, sortOrder: 1 },
  ]

  test("renders Create New Category modal header and handles cancel", () => {
    const onCancel = vi.fn()
    const onOpenChange = vi.fn()

    act(() => {
      root?.render(
        <CategoryDialog
          open={true}
          editing={null}
          categories={categories}
          onOpenChange={onOpenChange}
          onSubmit={() => undefined}
          onCancel={onCancel}
          createMutation={{ isPending: false }}
          updateMutation={{ isPending: false }}
        />,
      )
    })

    expect(document.body.textContent).toContain("Create New Category")
    expect(document.body.textContent).toContain("Name")
    expect(document.body.textContent).toContain("Description")

    const cancelBtn = Array.from(document.body.querySelectorAll("button")).find(
      (btn) => btn.textContent === "Cancel",
    )

    expect(cancelBtn).not.toBeUndefined()

    act(() => {
      cancelBtn?.click()
    })

    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
