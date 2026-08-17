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

import { GlobalSearch } from "@/components/layout/global-search"

const mockNavigate = vi.fn()

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: [], isLoading: false }),
}))

vi.mock("rpc/query", () => ({
  queryApi: {
    categories: { list: { queryOptions: vi.fn() } },
    tags: { list: { queryOptions: vi.fn() } },
    products: { list: { queryOptions: vi.fn() } },
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

describe("GlobalSearch", () => {
  test("renders search trigger button", () => {
    act(() => {
      root?.render(<GlobalSearch />)
    })

    const searchBtn = container?.querySelector("button")
    expect(searchBtn).not.toBeNull()
    expect(searchBtn?.textContent).toContain("Search")
    expect(searchBtn?.textContent).toContain("⌘K")
  })
})
