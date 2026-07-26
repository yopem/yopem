import { webhooksRoute } from "server/handlers/webhooks"
import { describe, expect, test } from "vitest"

describe("webhooks handler", () => {
  test("exports a route", () => {
    expect(webhooksRoute).toBeDefined()
  })
})
