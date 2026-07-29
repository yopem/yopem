import { describe, expect, test } from "vite-plus/test"

import { serverApi } from "rpc/server"

describe("serverApi", () => {
  test("is a typed RPC client proxy", () => {
    expect(serverApi).toBeDefined()
    expect(typeof serverApi.categories.list).toBe("function")
    expect(typeof serverApi.assets.list).toBe("function")
  })
})
