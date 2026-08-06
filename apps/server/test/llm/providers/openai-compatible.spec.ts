import { describe, expect, test } from "bun:test"
import * as mod from "server/llm/providers/openai-compatible"

describe("openai-compatible", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
