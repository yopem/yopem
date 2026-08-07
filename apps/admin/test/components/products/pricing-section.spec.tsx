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

import { PricingSection } from "@/components/products/pricing-section"

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

describe("PricingSection", () => {
  test("renders credits label and handles value changes", () => {
    const onCreditsChange = vi.fn()

    act(() => {
      root?.render(
        <PricingSection
          creditsPerRun={5}
          onCreditsPerRunChange={onCreditsChange}
        />,
      )
    })

    expect(container?.textContent).toContain("Credits consumed per run")
    expect(container?.textContent).toContain("credits")

    const input = container?.querySelector("input")
    expect(input).not.toBeNull()
    expect(input?.value).toBe("5")

    act(() => {
      if (input) {
        const desc = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )
        desc?.set?.call(input, "10")
        input.dispatchEvent(new Event("change", { bubbles: true }))
      }
    })

    expect(onCreditsChange).toHaveBeenCalledWith(10)
  })
})
