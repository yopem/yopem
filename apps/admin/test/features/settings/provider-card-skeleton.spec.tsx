// @vitest-environment jsdom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test"

import { ProviderCardSkeleton } from "@/features/settings/provider-card-skeleton"

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
})

describe("ProviderCardSkeleton", () => {
  test("renders skeleton container with spinner", () => {
    act(() => {
      root?.render(<ProviderCardSkeleton />)
    })

    const wrapper = container?.firstElementChild
    expect(wrapper).not.toBeNull()
    expect(wrapper?.className).toContain("flex h-40")
  })
})
