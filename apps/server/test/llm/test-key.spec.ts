import * as mod from "server/llm/test-key"
import { describe, expect, test } from "vite-plus/test"

describe("test-key", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
