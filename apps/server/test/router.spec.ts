import { apiApp } from "server/router"
import { describe, expect, test } from "vite-plus/test"

describe("apiApp", () => {
  test("is defined", () => {
    expect(apiApp).toBeDefined()
  })
})
