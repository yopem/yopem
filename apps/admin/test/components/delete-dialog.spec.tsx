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

import { DeleteDialog } from "@/components/delete-dialog"

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

describe("DeleteDialog", () => {
  test("renders title, description, and handles confirm action", () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    act(() => {
      root?.render(
        <DeleteDialog
          open={true}
          onOpenChange={onOpenChange}
          title="Delete Category"
          name="Electronics"
          onConfirm={onConfirm}
          isPending={false}
        />,
      )
    })

    expect(document.body.textContent).toContain("Delete Category")
    expect(document.body.textContent).toContain(
      'Are you sure you want to delete "Electronics"?',
    )

    const deleteBtn = Array.from(document.body.querySelectorAll("button")).find(
      (btn) => btn.textContent === "Delete",
    )

    expect(deleteBtn).not.toBeUndefined()

    act(() => {
      deleteBtn?.click()
    })

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  test("displays loading state when deletion is pending", () => {
    act(() => {
      root?.render(
        <DeleteDialog
          open={true}
          onOpenChange={() => undefined}
          title="Delete Product"
          name="Test Product"
          onConfirm={() => undefined}
          isPending={true}
        />,
      )
    })

    expect(document.body.textContent).toContain("Deleting...")
  })
})
