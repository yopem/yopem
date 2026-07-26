import { describe, expect, test } from "vite-plus/test"

import { clientApi } from "rpc/client"
import { prefetchQueries } from "rpc/prefetch"
import { QueryProvider } from "rpc/provider"
import { queryApi } from "rpc/query"
import { createQueryClient, getQueryClient } from "rpc/query-client"
import { serializer } from "rpc/serializer"
import { serverApi } from "rpc/server"
import { serverQueryApi } from "rpc/server-query"
import { createORPCLink, createORPCClientFromLink } from "rpc/shared"

describe("rpc package public surface", () => {
  test("client exports a router-bound proxy", () => {
    expect(typeof clientApi.categoryList).toBe("function")
  })

  test("query/server-query export tanstack-query utils", () => {
    expect(typeof queryApi.categoryList.queryOptions).toBe("function")
    expect(typeof serverQueryApi.categoryList.queryOptions).toBe("function")
  })

  test("query-client exports factory and cached getter", () => {
    expect(typeof createQueryClient).toBe("function")
    expect(typeof getQueryClient).toBe("function")
  })

  test("provider exports a React component", () => {
    expect(typeof QueryProvider).toBe("function")
  })

  test("prefetch exports a prefetchQueries function", () => {
    expect(typeof prefetchQueries).toBe("function")
  })

  test("shared exports link + client factories", () => {
    expect(typeof createORPCLink).toBe("function")
    expect(typeof createORPCClientFromLink).toBe("function")
  })

  test("serializer exports a configured instance", () => {
    expect(serializer).toBeDefined()
  })

  test("server exports a server-bound client proxy", () => {
    expect(typeof serverApi.categoryList).toBe("function")
  })
})
