import { describe, expect, test } from "vite-plus/test"

import * as mod from "db/test-utils/mock-db"

describe("packages/db/test-utils/mock-db", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.createMockDb).toBeDefined()
  })
})
