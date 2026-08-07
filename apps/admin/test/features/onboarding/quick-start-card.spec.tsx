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

import { QuickStartCard } from "@/features/onboarding/quick-start-card"

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

describe("QuickStartCard", () => {
  test("renders card icon, title, description, and action", () => {
    act(() => {
      root?.render(
        <QuickStartCard
          icon={<span data-testid="icon">🚀</span>}
          title="Quick Start"
          description="Get started in minutes"
          action={<button type="button">Start</button>}
        />,
      )
    })

    expect(container?.textContent).toContain("🚀")
    expect(container?.textContent).toContain("Quick Start")
    expect(container?.textContent).toContain("Get started in minutes")
    expect(container?.querySelector("button")?.textContent).toBe("Start")
  })
})
