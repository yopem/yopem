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

import { AssetUploadSettings } from "@/components/settings/asset-upload-settings"

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

describe("AssetUploadSettings", () => {
  test("renders upload settings title and input value", () => {
    act(() => {
      root?.render(
        <AssetUploadSettings
          defaultMaxUploadSize={50}
          isLoading={false}
          onSave={() => undefined}
        />,
      )
    })

    expect(container?.textContent).toContain("Asset Upload Settings")
    expect(container?.textContent).toContain("Maximum Upload Size (MB)")

    const input = container?.querySelector("input")
    expect(input?.value).toBe("50")
  })
})
