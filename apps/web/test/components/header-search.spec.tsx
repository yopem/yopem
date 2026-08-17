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

import { HeaderSearch } from "@/components/header-search"

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}))

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
})

describe("HeaderSearch", () => {
  test("renders a search form with a search input", () => {
    act(() => {
      root?.render(<HeaderSearch />)
    })

    expect(container?.querySelector("form")).not.toBeNull()
    const input = container?.querySelector('input[type="search"]')
    expect(input).not.toBeNull()
    expect(input?.getAttribute("placeholder")).toBe("Search tools...")
  })
})
