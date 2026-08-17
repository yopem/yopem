import { describe, expect, test } from "vite-plus/test"

import { serverQueryApi } from "rpc/server-query"

describe("serverQueryApi", () => {
  test("is a TanStack Query utils instance for server-side queries", () => {
    expect(serverQueryApi).toBeDefined()
    expect(typeof serverQueryApi.categories.list.queryOptions).toBe("function")
  })
})
