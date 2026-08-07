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

import { EditProviderDialog } from "@/components/settings/edit-provider-dialog"

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

describe("EditProviderDialog", () => {
  const provider: ApiKeyConfig = {
    id: "p1",
    provider: "openai",
    name: "Staging OpenAI",
    description: "Staging key",
    apiKey: "sk-abcdef",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }

  test("renders Edit Provider header and handles cancel", () => {
    const onCancel = vi.fn()

    act(() => {
      root?.render(
        <EditProviderDialog
          open={true}
          provider={provider}
          isPending={false}
          onOpenChange={() => undefined}
          onSubmit={() => undefined}
          onCancel={onCancel}
        />,
      )
    })

    expect(document.body.textContent).toContain("Edit Provider")

    const cancelBtn = Array.from(document.body.querySelectorAll("button")).find(
      (btn) => btn.textContent === "Cancel",
    )

    expect(cancelBtn).not.toBeUndefined()

    act(() => {
      cancelBtn?.click()
    })

    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
