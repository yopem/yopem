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

import type { ApiKeyConfig } from "utils/api-input"

import { ProviderCard } from "@/features/settings/provider-card"

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

describe("ProviderCard", () => {
  const apiKey: ApiKeyConfig = {
    id: "key_1",
    provider: "openai",
    name: "Dev Key",
    description: "For testing",
    apiKey: "sk-test123",
    status: "active",
    lastUsed: new Date("2026-01-01"),
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }

  test("renders provider name, badge, and secret key input", () => {
    act(() => {
      root?.render(
        <ProviderCard
          apiKey={apiKey}
          isVisible={false}
          onToggleVisibility={() => undefined}
          onEdit={() => undefined}
          onDelete={() => undefined}
          formatDateTime={(d) => String(d)}
        />,
      )
    })

    expect(container?.textContent).toContain("Dev Key")
    expect(container?.textContent).toContain("For testing")
    expect(container?.textContent).toContain("active")

    const input = container?.querySelector("input")
    expect(input?.value).toBe("sk-test123")
    expect(input?.getAttribute("type")).toBe("password")
  })

  test("toggles secret key visibility when eye icon clicked", () => {
    const onToggleVisibility = vi.fn()

    act(() => {
      root?.render(
        <ProviderCard
          apiKey={apiKey}
          isVisible={false}
          onToggleVisibility={onToggleVisibility}
          onEdit={() => undefined}
          onDelete={() => undefined}
          formatDateTime={(d) => String(d)}
        />,
      )
    })

    const input = container?.querySelector("input")
    const toggleBtn = input?.closest(".flex")?.querySelector("button")

    expect(toggleBtn).not.toBeNull()

    act(() => {
      toggleBtn?.click()
    })

    expect(onToggleVisibility).toHaveBeenCalledWith("key_1")
  })
})
