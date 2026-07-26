import * as mod from "server/llm/providers/openai-compatible"
import { describe, expect, test } from "vite-plus/test"

describe("openai-compatible", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
