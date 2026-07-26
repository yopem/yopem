import { describe, expect, test } from "vite-plus/test"

import * as rpc from "rpc"

describe("rpc package barrel", () => {
  test("exports the public API", () => {
    expect(rpc.createRPCClient).toBeDefined()
    expect(rpc.createORPCUtils).toBeDefined()
    expect(rpc.createQueryClient).toBeDefined()
    expect(rpc.RPCProvider).toBeDefined()
    expect(rpc.HydrationBoundary).toBeDefined()
    expect(rpc.RPCHydrationBoundary).toBeDefined()
  })
})
