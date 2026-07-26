import { describe, expect, test } from "vite-plus/test"

import { HydrationBoundary, RPCHydrationBoundary } from "rpc/hydration"

describe("hydration", () => {
  test("re-exports HydrationBoundary", () => {
    expect(HydrationBoundary).toBeDefined()
    expect(typeof HydrationBoundary).toBe("function")
  })

  test("RPCHydrationBoundary is a React component", () => {
    expect(typeof RPCHydrationBoundary).toBe("function")
  })
})
