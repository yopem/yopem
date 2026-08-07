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

import { ProductFormCategoryDialog } from "@/features/products/product-form-category-dialog"

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

describe("ProductFormCategoryDialog", () => {
  test("renders Create New Category header and handles cancel", () => {
    const onCancel = vi.fn()

    act(() => {
      root?.render(
        <ProductFormCategoryDialog
          open={true}
          categories={[]}
          createMutation={{ mutate: vi.fn(), isPending: false } as never}
          onOpenChange={() => undefined}
          onCancel={onCancel}
        />,
      )
    })

    expect(document.body.textContent).toContain("Create New Category")

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
