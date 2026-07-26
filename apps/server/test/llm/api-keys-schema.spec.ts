import * as mod from "server/llm/api-keys-schema"
import { describe, expect, test } from "vitest"

describe("api-keys-schema", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
