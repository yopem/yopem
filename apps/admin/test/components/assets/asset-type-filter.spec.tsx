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

import { AssetTypeFilter } from "@/components/assets/asset-type-filter"

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

describe("AssetTypeFilter", () => {
  test("renders all filter options and handles selection", () => {
    const onTypeChange = vi.fn()

    act(() => {
      root?.render(
        <AssetTypeFilter selectedType="all" onTypeChange={onTypeChange} />,
      )
    })

    const buttons = container?.querySelectorAll("button")
    expect(buttons?.length).toBe(5)

    const imagesBtn = Array.from(buttons ?? []).find(
      (btn) => btn.textContent === "Images",
    )
    expect(imagesBtn).not.toBeUndefined()

    act(() => {
      imagesBtn?.click()
    })

    expect(onTypeChange).toHaveBeenCalledWith("images")
  })
})
