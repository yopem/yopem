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

import { ThumbnailSelector } from "@/components/products/thumbnail-selector"

vi.mock("rpc/query", () => ({
  queryApi: {
    assets: { list: { call: vi.fn().mockResolvedValue({ assets: [] }) } },
  },
}))

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

describe("ThumbnailSelector", () => {
  test("renders thumbnail collapsible card and trigger button", () => {
    act(() => {
      root?.render(
        <ThumbnailSelector value={undefined} onChange={() => undefined} />,
      )
    })

    expect(container?.textContent).toContain("Thumbnail")
    expect(container?.textContent).toContain("Select Thumbnail")
  })
})
