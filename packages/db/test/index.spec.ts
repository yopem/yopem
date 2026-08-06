import { describe, expect, test, vi } from "vite-plus/test"

vi.mock("bun", () => ({
  SQL: class SQLMock {},
}))

import { db } from "db"

describe("db index", () => {
  test("exports a drizzle db instance", () => {
    expect(db).toBeDefined()
  })
})
