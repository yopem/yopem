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

import { RangeSlider } from "@/components/products/range-slider"

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

describe("RangeSlider", () => {
  test("renders label and formatted value", () => {
    act(() => {
      root?.render(
        <RangeSlider
          label="Temperature"
          value={0.7}
          min={0}
          max={1}
          step={0.1}
          onChange={() => undefined}
          formatValue={(v) => `${v * 100}%`}
        />,
      )
    })

    expect(container?.textContent).toContain("Temperature")
    expect(container?.textContent).toContain("70%")
  })
})
