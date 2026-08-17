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

import { GlobalError } from "@/components/global-error"

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    className,
  }: {
    children?: React.ReactNode
    to?: string
    className?: string
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
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
  vi.clearAllMocks()
})

describe("GlobalError", () => {
  test("renders error title, message, and try again handler", () => {
    const error = new Error("Failed to load data")
    const reset = vi.fn()

    act(() => {
      root?.render(<GlobalError error={error} reset={reset} />)
    })

    expect(container?.textContent).toContain("Oops! Something went wrong")

    const tryAgainBtn = Array.from(
      container?.querySelectorAll("button") ?? [],
    ).find((btn) => btn.textContent?.includes("Try again"))

    expect(tryAgainBtn).not.toBeUndefined()

    act(() => {
      tryAgainBtn?.click()
    })

    expect(reset).toHaveBeenCalledTimes(1)

    const homeLink = container?.querySelector("a")
    expect(homeLink?.getAttribute("href")).toBe("/")
  })
})
