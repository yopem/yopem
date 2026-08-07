import { describe, expect, test, vi } from "vite-plus/test"

vi.mock("bun", () => ({ SQL: class SQLMock {} }))
import * as mod from "db/schema/index"
describe("packages/db/schema/index", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
