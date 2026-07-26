import { describe, expect, test } from "vite-plus/test"

import { getRouter } from "@/router"

describe("router", () => {
  test("getRouter is an async factory (resolves session into context)", () => {
    expect(typeof getRouter).toBe("function")
    expect(getRouter.constructor.name).toBe("AsyncFunction")
  })
})
