import * as mod from "server/llm/test-key"
import { describe, expect, test } from "vitest"

describe("test-key", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
