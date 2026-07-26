import { describe, expect, test } from "vite-plus/test"

import { RPCProvider } from "rpc/provider"

describe("RPCProvider", () => {
  test("is a React component (function)", () => {
    expect(typeof RPCProvider).toBe("function")
  })
})
