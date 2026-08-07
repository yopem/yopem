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

import { Forbidden } from "@/components/forbidden"
import { logoutFn } from "@/lib/auth"

vi.mock("@/lib/auth", () => ({
  logoutFn: vi.fn(),
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

describe("Forbidden", () => {
  test("renders 403 status message and handles sign out button click", () => {
    vi.mocked(logoutFn).mockResolvedValue({ redirectTo: "/auth/login" })

    act(() => {
      root?.render(<Forbidden />)
    })

    expect(container?.textContent).toContain("403")
    expect(container?.textContent).toContain(
      "You don't have access to this area",
    )

    const signOutBtn = container?.querySelector("button")
    expect(signOutBtn).not.toBeNull()

    act(() => {
      signOutBtn?.click()
    })

    expect(logoutFn).toHaveBeenCalledTimes(1)
  })
})
