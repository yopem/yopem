import { describe, expect, test } from "vite-plus/test"

import { clientApi } from "rpc/client"

describe("rpc client", () => {
  test("clientApi is a typed proxy bound to the router procedures", () => {
    expect(clientApi).toBeDefined()
    expect(typeof clientApi.categoryList).toBe("function")
    expect(typeof clientApi.categoryById).toBe("function")
    expect(typeof clientApi.categoryCreate).toBe("function")
    expect(typeof clientApi.categoryUpdate).toBe("function")
    expect(typeof clientApi.categoryDelete).toBe("function")
  })
})
