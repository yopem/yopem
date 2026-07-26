import { describe, expect, test } from "vite-plus/test"

import { db } from "db"

describe("db index", () => {
  test("exports a drizzle db instance", () => {
    expect(db).toBeDefined()
  })
})
