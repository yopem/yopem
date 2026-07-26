import * as mod from "server/llm/providers/base"
import { describe, expect, test } from "vite-plus/test"

describe("base", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
