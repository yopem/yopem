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

import { DeleteProviderDialog } from "@/features/settings/delete-provider-dialog"

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

describe("DeleteProviderDialog", () => {
  const provider: ApiKeyConfig = {
    id: "p1",
    provider: "openai",
    name: "Production OpenAI Key",
    description: "Prod key",
    apiKey: "sk-prod123",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }

  test("renders delete confirmation title, provider name, and handles submit", () => {
    const onSubmit = vi.fn()

    act(() => {
      root?.render(
        <DeleteProviderDialog
          open={true}
          provider={provider}
          isPending={false}
          onOpenChange={() => undefined}
          onSubmit={onSubmit}
          onCancel={() => undefined}
        />,
      )
    })

    expect(document.body.textContent).toContain("Delete Provider")
    expect(document.body.textContent).toContain("Production OpenAI Key")

    const deleteBtn = Array.from(document.body.querySelectorAll("button")).find(
      (btn) => btn.textContent === "Delete Provider",
    )

    expect(deleteBtn).not.toBeUndefined()

    act(() => {
      deleteBtn?.click()
    })

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
