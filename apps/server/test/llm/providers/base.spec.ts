import * as mod from "server/llm/providers/base"
import { describe, expect, test } from "vitest"

describe("base", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
