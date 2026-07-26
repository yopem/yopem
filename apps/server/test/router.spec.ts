import { apiApp } from "server/router"
import { describe, expect, test } from "vitest"

describe("apiApp", () => {
  test("is defined", () => {
    expect(apiApp).toBeDefined()
  })
})
