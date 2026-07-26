import { describe, expect, test } from "vite-plus/test"

import { createRPCClient } from "rpc/client"

describe("rpc client", () => {
  test("createRPCClient returns a typed proxy bound to the router", () => {
    const client = createRPCClient("http://localhost:4000/rpc")
    expect(client).toBeDefined()
    expect(typeof client.categoryList).toBe("function")
    expect(typeof client.categoryById).toBe("function")
    expect(typeof client.categoryCreate).toBe("function")
    expect(typeof client.categoryUpdate).toBe("function")
    expect(typeof client.categoryDelete).toBe("function")
  })
})
