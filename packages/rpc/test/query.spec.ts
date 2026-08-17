import { describe, expect, test } from "vite-plus/test"

import { queryApi } from "rpc/query"

describe("queryApi", () => {
  test("is a TanStack Query utils instance with typed procedures", () => {
    expect(queryApi).toBeDefined()
    expect(typeof queryApi.categories.list.queryOptions).toBe("function")
    expect(typeof queryApi.assets.list.queryOptions).toBe("function")
  })
})
