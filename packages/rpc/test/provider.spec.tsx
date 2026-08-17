import { describe, expect, test } from "vite-plus/test"

import { QueryProvider } from "rpc/provider"

describe("QueryProvider", () => {
  test("is a React component (function)", () => {
    expect(typeof QueryProvider).toBe("function")
  })
})
