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

import { NotFound } from "@/components/not-found"

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

describe("NotFound", () => {
  test("renders 404 heading, message, and go home link", () => {
    act(() => {
      root?.render(<NotFound />)
    })

    expect(container?.textContent).toContain("404")
    expect(container?.textContent).toContain("Page not found")

    const link = container?.querySelector("a")
    expect(link?.getAttribute("href")).toBe("/")
    expect(link?.textContent).toContain("Go home")
  })
})
