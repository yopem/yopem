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

import { ApiKeySelector } from "@/components/products/api-key-selector"

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

describe("ApiKeySelector", () => {
  test("renders label and notice when no keys available", () => {
    act(() => {
      root?.render(
        <ApiKeySelector
          value={undefined}
          onChange={() => undefined}
          availableKeys={[]}
        />,
      )
    })

    expect(container?.textContent).toContain("API Provider Credentials")
    expect(container?.textContent).toContain("No active API keys available")
  })
})
