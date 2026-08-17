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

import { TagDialog } from "@/features/categories-tags/tag-dialog"

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

describe("TagDialog", () => {
  test("renders Create New Tag title and handles cancel button click", () => {
    const onCancel = vi.fn()

    act(() => {
      root?.render(
        <TagDialog
          open={true}
          editing={null}
          onOpenChange={() => undefined}
          onSubmit={() => undefined}
          onCancel={onCancel}
          createMutation={{ isPending: false }}
          updateMutation={{ isPending: false }}
        />,
      )
    })

    expect(document.body.textContent).toContain("Create New Tag")

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
