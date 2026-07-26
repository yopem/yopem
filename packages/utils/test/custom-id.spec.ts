import { describe, expect, test } from "vitest"

import { createCustomId } from "utils/custom-id"

describe("createCustomId", () => {
  test("returns a 64 character string", () => {
    const id = createCustomId()
    expect(id).toHaveLength(64)
  })

  test("returns only alphanumeric characters", () => {
    const id = createCustomId()
    expect(id).toMatch(/^[a-zA-Z0-9]+$/)
  })

  test("returns unique values on successive calls", () => {
    const ids = new Set(Array.from({ length: 10 }, () => createCustomId()))
    expect(ids.size).toBe(10)
  })
})
