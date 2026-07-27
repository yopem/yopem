import { describe, expect, test } from "vite-plus/test"

import { queryApi } from "rpc/query"

describe("orpc utils", () => {
  test("queryApi is a proxy with per-procedure queryOptions/mutationOptions", () => {
    expect(queryApi).toBeDefined()
    expect(typeof queryApi.categories.list.key).toBe("function")
    expect(typeof queryApi.categories.list.queryOptions).toBe("function")
  })
})
