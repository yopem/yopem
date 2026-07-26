import { describe, expect, test } from "vitest"

import { db } from "db"

describe("db index", () => {
  test("exports a drizzle db instance", () => {
    expect(db).toBeDefined()
  })
})
