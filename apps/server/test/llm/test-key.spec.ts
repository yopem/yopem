import { describe, expect, test } from "bun:test"
import * as mod from "server/llm/test-key"

describe("test-key", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
