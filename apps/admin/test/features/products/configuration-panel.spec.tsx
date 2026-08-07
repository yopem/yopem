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

import { ConfigurationPanel } from "@/features/products/configuration-panel"

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

describe("ConfigurationPanel", () => {
  const config = {
    outputFormat: "plain" as const,
    creditsPerRun: 5,
    apiKeyId: "key_1",
    availableApiKeys: [],
  }

  const handlers = {
    onOutputFormatChange: vi.fn(),
    onCreditsPerRunChange: vi.fn(),
    onApiKeyIdChange: vi.fn(),
  }

  test("renders Output Format and Usage Pricing sections", () => {
    act(() => {
      root?.render(<ConfigurationPanel config={config} handlers={handlers} />)
    })

    expect(container?.textContent).toContain("Configure")
    expect(container?.textContent).toContain("Output Format")
    expect(container?.textContent).toContain("Usage Pricing")
  })
})
