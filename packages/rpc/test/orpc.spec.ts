import { describe, expect, test } from "vite-plus/test"

import { createRPCClient } from "rpc/client"
import { createORPCUtils } from "rpc/orpc"

describe("orpc utils", () => {
  test("createORPCUtils returns a proxy with per-procedure queryOptions", () => {
    const client = createRPCClient("http://localhost:4000/rpc")
    const utils = createORPCUtils(client)
    expect(utils).toBeDefined()
    expect(typeof utils.categoryList.queryOptions).toBe("function")
    expect(typeof utils.categoryList.mutationOptions).toBe("function")
  })
})
