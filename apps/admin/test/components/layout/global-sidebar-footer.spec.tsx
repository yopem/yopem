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

import { GlobalSidebarFooter } from "@/components/layout/global-sidebar-footer"

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

describe("GlobalSidebarFooter", () => {
  const user = {
    name: "Jane Doe",
    email: "jane@example.com",
    avatar: "https://example.com/avatar.jpg",
  }

  test("renders user name and email", () => {
    act(() => {
      root?.render(<GlobalSidebarFooter user={user} />)
    })

    expect(container?.textContent).toContain("Jane Doe")
    expect(container?.textContent).toContain("jane@example.com")
  })

  test("renders avatar initials fallback when no image loaded", () => {
    const userNoAvatar = {
      name: "Alex Smith",
      email: "alex@example.com",
    }

    act(() => {
      root?.render(<GlobalSidebarFooter user={userNoAvatar} />)
    })

    expect(container?.textContent).toContain("AS")
  })
})
