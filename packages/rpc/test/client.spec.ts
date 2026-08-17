import { describe, expect, test } from "vite-plus/test"

import { clientApi } from "rpc/client"

describe("rpc client", () => {
  test("clientApi is a typed proxy bound to the router procedures", () => {
    expect(clientApi).toBeDefined()
    expect(typeof clientApi.categories.list).toBe("function")
    expect(typeof clientApi.categories.byId).toBe("function")
    expect(typeof clientApi.categories.create).toBe("function")
    expect(typeof clientApi.categories.update).toBe("function")
    expect(typeof clientApi.categories.delete).toBe("function")
  })
})
