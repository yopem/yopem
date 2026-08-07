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

import { ProductFormTabs } from "@/components/products/product-form-tabs"

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

describe("ProductFormTabs", () => {
  test("renders form steps and handles step click", () => {
    const onStepChange = vi.fn()

    act(() => {
      root?.render(
        <ProductFormTabs activeStep="basics" onStepChange={onStepChange} />,
      )
    })

    expect(container?.textContent).toContain("Basics")
    expect(container?.textContent).toContain("Workflow")
    expect(container?.textContent).toContain("Configure")

    const buttons = container?.querySelectorAll("button")
    expect(buttons?.length).toBe(3)

    act(() => {
      ;(buttons?.[1] as HTMLElement)?.click()
    })

    expect(onStepChange).toHaveBeenCalledWith("workflow")
  })
})
