import { describe, expect, test, vi } from "vite-plus/test"

vi.mock("bun", () => ({
  SQL: class SQLMock {},
}))

import * as mod from "db/services/user"

describe("packages/db/services/user", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.getUserStats).toBeDefined()
    expect(mod.getUserRuns).toBeDefined()
    expect(mod.getUserSettings).toBeDefined()
    expect(mod.upsertUserSettings).toBeDefined()
  })
})
