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

import { SlugField } from "@/components/slug-field"

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: { available: true }, isFetching: false }),
}))

vi.mock("rpc/query", () => ({
  queryApi: {
    slugs: { check: { queryOptions: vi.fn() } },
  },
}))

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

describe("SlugField", () => {
  test("renders label and input value, calling onChange on user input", () => {
    const onChange = vi.fn()

    act(() => {
      root?.render(
        <SlugField
          value="my-slug"
          onChange={onChange}
          entity="category"
          label="Category Slug"
        />,
      )
    })

    expect(container?.textContent).toContain("Category Slug")

    const input = container?.querySelector("input")
    expect(input).not.toBeNull()
    expect(input?.value).toBe("my-slug")

    act(() => {
      if (input) {
        const desc = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )
        desc?.set?.call(input, "New Category Name!")
        input.dispatchEvent(new Event("input", { bubbles: true }))
      }
    })

    expect(onChange).toHaveBeenCalledWith("new-category-name")
  })
})
