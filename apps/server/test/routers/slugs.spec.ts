import * as mod from "server/routers/slugs"
import { describe, expect, test } from "vite-plus/test"

describe("apps/server/routers/slugs", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.slugsRouter).toBeDefined()
  })
})
