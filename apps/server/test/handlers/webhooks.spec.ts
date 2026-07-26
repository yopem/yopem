import { webhooksRoute } from "server/handlers/webhooks"
import { describe, expect, test } from "vite-plus/test"

describe("webhooks handler", () => {
  test("exports a route", () => {
    expect(webhooksRoute).toBeDefined()
  })
})
