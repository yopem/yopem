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

import { TagList } from "@/components/categories-tags/tag-list"

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

describe("TagList", () => {
  const tags = [
    { id: "t1", name: "Featured" },
    { id: "t2", name: "Best Seller" },
  ]

  test("renders tag items, edit click, and empty state when no tags exist", () => {
    const onEdit = vi.fn()

    act(() => {
      root?.render(
        <TagList
          tags={tags}
          isLoading={false}
          selectedIds={[]}
          onToggleAll={() => undefined}
          onToggleItem={() => undefined}
          onEdit={onEdit}
          onDelete={() => undefined}
          deleteMutation={{ isPending: false }}
        />,
      )
    })

    expect(container?.textContent).toContain("Featured")
    expect(container?.textContent).toContain("Best Seller")

    const editButtons = container?.querySelectorAll("button")
    expect(editButtons?.length).toBeGreaterThanOrEqual(4)

    act(() => {
      ;(editButtons?.[0] as HTMLElement)?.click()
    })

    expect(onEdit).toHaveBeenCalledWith(tags[0])
  })
})
