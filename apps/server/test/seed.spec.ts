import { describe, expect, test } from "vite-plus/test"

describe("seed module", () => {
  test("module imports without crashing", async () => {
    const mod = await import("server/seed")
    expect(mod).toBeDefined()
  })
})
