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

import { ModelSelector } from "@/features/products/model-selector"

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

describe("ModelSelector", () => {
  test("renders model search input", () => {
    act(() => {
      root?.render(
        <ModelSelector
          value="gpt-4"
          onChange={() => undefined}
          options={["gpt-4", "gpt-3.5-turbo"]}
        />,
      )
    })

    const input = container?.querySelector("input")
    expect(input).not.toBeNull()
    expect(input?.placeholder).toBe("Search models...")
  })
})
