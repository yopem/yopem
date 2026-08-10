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

import { MarketplaceCta } from "@/features/landing/marketplace-cta"
import { loginAndRedirect } from "@/lib/login"

let sessionValue: unknown = null

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => (
    <a href="/products">{children}</a>
  ),
  useRouteContext: () => ({ session: sessionValue }),
}))

vi.mock("@/lib/login", () => ({
  loginAndRedirect: vi.fn(),
}))

let container: HTMLDivElement | null = null
let root: Root | null = null

beforeEach(() => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  sessionValue = null
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

describe("MarketplaceCta", () => {
  test("shows Get Started and triggers login when logged out", () => {
    act(() => {
      root?.render(<MarketplaceCta />)
    })

    const button = container?.querySelector("button")
    expect(button?.textContent).toContain("Get Started")

    act(() => {
      button?.click()
    })

    expect(loginAndRedirect).toHaveBeenCalledWith("/products")
  })

  test("shows a marketplace link when logged in", () => {
    sessionValue = { id: "1" }

    act(() => {
      root?.render(<MarketplaceCta />)
    })

    const link = container?.querySelector("a")
    expect(link?.textContent).toContain("Browse marketplace")
  })
})
